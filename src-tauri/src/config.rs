use crate::AppState;
use rusqlite::params;

#[tauri::command]
pub fn save_config(
    state: tauri::State<AppState>,
    url: String,
    token: String,
    labels: String,
    gitlab_user: String,
    gitlab_user_id: i64,
) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    conn.execute("DELETE FROM config", []).unwrap();
    conn.execute(
        "INSERT INTO config (url, token, labels, gitlab_user, gitlab_user_id) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![url, token, labels, gitlab_user, gitlab_user_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}


#[tauri::command]
pub fn load_config(state: tauri::State<AppState>) -> Result<(String, String, String, String, i64), String> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare("SELECT url, token, labels, gitlab_user, gitlab_user_id FROM config LIMIT 1").unwrap();
    let mut rows = stmt.query([]).unwrap();
    if let Some(row) = rows.next().unwrap() {
        let url: String = row.get(0).unwrap();
        let token: String = row.get(1).unwrap();
        let labels: String = row.get(2).unwrap_or_default();
        let gitlab_user: String = row.get(3).unwrap_or_default();
        let gitlab_user_id: i64 = row.get(4).unwrap_or(0);
        Ok((url, token, labels, gitlab_user, gitlab_user_id))
    } else {
        Err("Nenhuma configuração encontrada".into())
    }
}
