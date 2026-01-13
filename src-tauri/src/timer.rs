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
pub fn start_timer(app: AppHandle, state: State<SharedTimer>) {
    let timer = state.inner().clone();

    {
        let mut t = timer.lock().unwrap();
        if t.running {
            return;
        }
        t.running = true;
    }

    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_secs(1));

            let mut t = timer.lock().unwrap();
            if !t.running {
                break;
            }

            t.seconds += 1;

            let _ = app.emit("timer:tick", t.seconds);
        }
    });
}

#[tauri::command]
pub fn pause_timer(state: State<SharedTimer>) {
    let mut t = state.lock().unwrap();
    t.running = false;
}

#[tauri::command]
pub fn stop_timer(state: State<SharedTimer>) {
    let mut t = state.lock().unwrap();
    t.running = false;
    t.seconds = 0;
}
