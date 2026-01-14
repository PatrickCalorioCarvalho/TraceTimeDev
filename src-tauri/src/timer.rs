use std::{
    sync::{Arc, Mutex},
    thread,
    time::Duration,
};

use tauri::{AppHandle, State, Emitter};

#[derive(Default)]
pub struct TimerState {
    pub running: bool,
    pub seconds: u64,
}

pub type SharedTimer = Arc<Mutex<TimerState>>;

#[tauri::command]
pub fn start_timer(
    app: AppHandle,
    state: State<SharedTimer>,
    group_id: i64,
    project_id: i64,
    issue_id: i64,
    label: String,
) {
    let timer = state.inner().clone();

    {
        let mut t = timer.lock().unwrap();
        if t.running {
            return;
        }
        t.running = true;
    }

    thread::spawn(move || {
        let conn = rusqlite::Connection::open("timer.db").unwrap();

        // cria ou atualiza sessão
        conn.execute(
            "INSERT INTO sessions (group_id, project_id, issue_id, label, seconds, status)
             VALUES (?1, ?2, ?3, ?4, 0, 'runner')",
            rusqlite::params![group_id, project_id, issue_id, label],
        ).unwrap();

        loop {
            thread::sleep(Duration::from_secs(1));

            let mut t = timer.lock().unwrap();
            if !t.running {
                break;
            }

            t.seconds += 1;
            
            let seconds: i64 = t.seconds as i64;
            conn.execute(
                "UPDATE sessions SET seconds=?1, status='runner', updated_at=CURRENT_TIMESTAMP
                 WHERE group_id=?2 AND project_id=?3 AND issue_id=?4",
                rusqlite::params![seconds, group_id, project_id, issue_id],
            ).unwrap();

            let _ = app.emit("timer:tick", t.seconds);
        }
    });
}


#[tauri::command]
pub fn pause_timer(state: State<SharedTimer>) {
    let mut t = state.lock().unwrap();
    t.running = false;

    let conn = rusqlite::Connection::open("timer.db").unwrap();
    conn.execute("UPDATE sessions SET status='pause', updated_at=CURRENT_TIMESTAMP WHERE id=1", []).unwrap();
}

#[tauri::command]
pub fn stop_timer(state: State<SharedTimer>) {
    let mut t = state.lock().unwrap();
    t.running = false;
    t.seconds = 0;

    let conn = rusqlite::Connection::open("timer.db").unwrap();
    conn.execute("UPDATE sessions SET status='finalizado', seconds=0, updated_at=CURRENT_TIMESTAMP WHERE id=1", []).unwrap();
}

