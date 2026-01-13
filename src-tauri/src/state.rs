use std::sync::Mutex;
use std::time::{Instant, Duration};

#[derive(Default)]
pub struct TimerState {
    pub running: bool,
    pub start_time: Option<Instant>,
    pub elapsed: Duration,
}

pub struct AppState {
    pub timer: Mutex<TimerState>,
}
