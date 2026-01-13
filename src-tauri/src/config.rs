use crate::AppState;
use rusqlite::params;


#[tauri::command]
pub fn save_config(state: tauri::State<AppState>, url: String, token: String) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();
    conn.execute("DELETE FROM config", []).unwrap();
    conn.execute(
        "INSERT INTO config (url, token) VALUES (?1, ?2)",
        params![url, token],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn load_config(state: tauri::State<AppState>) -> Result<(String, String), String> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare("SELECT url, token FROM config LIMIT 1").unwrap();
    let mut rows = stmt.query([]).unwrap();
    if let Some(row) = rows.next().unwrap() {
        let url: String = row.get(0).unwrap();
        let token: String = row.get(1).unwrap();
        Ok((url, token))
    } else {
        Err("Nenhuma configuração encontrada".into())
    }
}
