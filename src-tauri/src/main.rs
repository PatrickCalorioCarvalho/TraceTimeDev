mod tray;
mod timer;

use std::sync::{Arc, Mutex};
use timer::{TimerState, SharedTimer};

fn main() {
    tauri::Builder::default()
        .manage::<SharedTimer>(Arc::new(Mutex::new(TimerState::default())))
        .invoke_handler(tauri::generate_handler![
            timer::start_timer,
            timer::pause_timer,
            timer::stop_timer,
        ])
        .setup(|app| {
            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
