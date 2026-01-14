mod tray;
mod timer;
mod config;
mod gitlab;
use tauri::Manager;
use std::sync::{Arc, Mutex};
use timer::{TimerState, SharedTimer};
use rusqlite::Connection; 
use std::fs;

struct AppState { 
    conn: Mutex<Connection>
}

fn main() {
    tauri::Builder::default()
        .manage::<SharedTimer>(Arc::new(Mutex::new(TimerState::default())))
        .invoke_handler(tauri::generate_handler![
            timer::start_timer,
            timer::pause_timer,
            timer::stop_timer,
            config::save_config,
            config::load_config,
            gitlab::test_gitlab,
            gitlab::gitlab_groups,
            gitlab::gitlab_projects,
            gitlab::gitlab_issues,
        ])
        .setup(|app| {
            let app_data_dir_path = app.path().app_data_dir().expect("Failed to get app data dir");
            fs::create_dir_all(&app_data_dir_path).expect("Não conseguiu criar pasta de dados");
            let db_path = app_data_dir_path.join("config.db");
            let conn = Connection::open(db_path).expect("Erro ao abrir banco");
            conn.execute(
                "CREATE TABLE IF NOT EXISTS config (
                        id INTEGER PRIMARY KEY,
                        url TEXT NOT NULL,
                        token TEXT NOT NULL,
                        labels TEXT DEFAULT '',
                        gitlab_user TEXT,
                        gitlab_user_id INTEGER
                    )",
                [],
            ).unwrap();
            conn.execute(
                "CREATE TABLE IF NOT EXISTS sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        group_id INTEGER,
                        project_id INTEGER,
                        issue_id INTEGER,
                        label TEXT,
                        seconds INTEGER DEFAULT 0,
                        status TEXT,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )",
                [],
            ).unwrap();

            app.manage(AppState {
                conn: Mutex::new(conn),
            });

            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
