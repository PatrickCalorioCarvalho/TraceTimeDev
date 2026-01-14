
use crate::AppState;
use crate::tray::update_tray_icon;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, State};
use rusqlite::{params};

#[derive(Default)]
pub struct TimerState {
    pub running: bool,
}

pub type SharedTimer = Arc<Mutex<TimerState>>;

fn format_gitlab_time(total_seconds: i64) -> String {
    let mut secs = total_seconds;
    let days = secs / 86400;
    secs %= 86400;
    let hours = secs / 3600;
    secs %= 3600;
    let minutes = secs / 60;
    secs %= 60;

    let mut result = String::new();
    if days > 0 { result.push_str(&format!("{}d", days)); }
    if hours > 0 { result.push_str(&format!("{}h", hours)); }
    if minutes > 0 { result.push_str(&format!("{}m", minutes)); }
    if secs > 0 || result.is_empty() { result.push_str(&format!("{}s", secs)); }
    result
}

#[tauri::command]
pub fn start_timer(
    app: AppHandle,
    state: tauri::State<AppState>,
    group_id: i64,
    project_id: i64,
    issue_id: i64,
    label: String,
    state_time: State<SharedTimer>,
) -> i64 {
    let conn = state.conn.lock().unwrap();
    {
        let mut t = state_time.lock().unwrap();
        if t.running {
            return -1; // já rodando
        }
        t.running = true;
    }

    conn.execute(
        "INSERT INTO sessions (group_id, project_id, issue_id, label, status)
         VALUES (?1, ?2, ?3, ?4, 'runner')",
        params![group_id, project_id, issue_id, label],
    ).unwrap();

    let session_id = conn.last_insert_rowid();

    conn.execute(
        "INSERT INTO session_intervals (session_id, start_time)
         VALUES (?1, strftime('%s','now'))",
        params![session_id],
    ).unwrap();
    
    update_tray_icon(&app, "runner");

    session_id
}

/// Pausa a sessão
#[tauri::command]
pub fn pause_timer(app: AppHandle, state: tauri::State<AppState>, session_id: i64, state_time: State<SharedTimer>) {
    let conn = state.conn.lock().unwrap();

    {
        let mut t = state_time.lock().unwrap();
        t.running = false;
    }

    conn.execute(
        "UPDATE session_intervals
         SET end_time = strftime('%s','now')
         WHERE session_id=?1 AND end_time IS NULL",
        params![session_id],
    ).unwrap();

    conn.execute(
        "UPDATE sessions SET status='pause', updated_at=strftime('%s','now')
         WHERE id=?1",
        params![session_id],
    ).unwrap();

    update_tray_icon(&app, "pause");
}

/// Retoma a sessão
#[tauri::command]
pub fn resume_timer(app: AppHandle,state: tauri::State<AppState>, session_id: i64, state_time: State<SharedTimer>) {
    let conn = state.conn.lock().unwrap();
    {
        let mut t = state_time.lock().unwrap();
        t.running = true;
    }
    conn.execute(
        "INSERT INTO session_intervals (session_id, start_time)
         VALUES (?1, strftime('%s','now'))",
        params![session_id],
    ).unwrap();

    conn.execute(
        "UPDATE sessions SET status='runner', updated_at=strftime('%s','now')
         WHERE id=?1",
        params![session_id],
    ).unwrap();
    update_tray_icon(&app, "runner");
}

/// Finaliza a sessão
#[tauri::command]
pub fn stop_timer(app: AppHandle,state: tauri::State<AppState>, session_id: i64, state_time: State<SharedTimer>) {
    let conn = state.conn.lock().unwrap();

    {
        let mut t = state_time.lock().unwrap();
        t.running = false;
    }

    conn.execute(
        "UPDATE session_intervals
         SET end_time = strftime('%s','now')
         WHERE session_id=?1 AND end_time IS NULL",
        params![session_id],
    ).unwrap();

    conn.execute(
        "UPDATE sessions SET status='finalizado', updated_at=strftime('%s','now')
         WHERE id=?1",
        params![session_id],
    ).unwrap();
    update_tray_icon(&app, "idle");
}

/// Calcula tempo acumulado formatado
#[tauri::command]
pub fn get_session_time(state: tauri::State<AppState>, session_id: i64) -> String {
    let conn = state.conn.lock().unwrap();
    get_preview_time(&conn, session_id)
}

fn get_preview_time(conn: &rusqlite::Connection, session_id: i64) -> String {

    let mut stmt = conn.prepare(
        "SELECT SUM(COALESCE(end_time, strftime('%s','now')) - start_time)
         FROM session_intervals
         WHERE session_id=?1"
    ).unwrap();

    let total: i64 = stmt.query_row([session_id], |row| row.get(0)).unwrap_or(0);

    format_gitlab_time(total)
}

/// Recupera última sessão (para reabrir app)
#[tauri::command]
pub fn resume_last_session(state: tauri::State<AppState>) -> Option<(i64, i64, i64, i64, String, String, String)> {
    
    let conn = state.conn.lock().unwrap();

    let mut stmt = conn.prepare(
        "SELECT id, group_id, project_id, issue_id, label, status
         FROM sessions ORDER BY updated_at DESC LIMIT 1"
    ).unwrap();

    if let Some(row) = stmt.query_row([], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, i64>(1)?,
            row.get::<_, i64>(2)?,
            row.get::<_, i64>(3)?,
            row.get::<_, String>(4)?,
            row.get::<_, String>(5)?,
        ))
    }).ok() {
        let session_id = row.0;
        let status_time = row.5.clone();

        // se estava rodando, marca como pausado
        let final_status = if status_time == "runner" {
            conn.execute(
                "UPDATE sessions SET status='pause' WHERE id=?1",
                params![session_id],
            ).unwrap();
            "pause".to_string()
        } else {
            status_time
        };
        let preview = get_preview_time(&conn, session_id);

        return Some((row.0, row.1, row.2, row.3, row.4, final_status, preview));
    }
    None
}