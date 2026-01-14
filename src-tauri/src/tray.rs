
use tauri::{
    AppHandle, Manager, Result, WebviewUrl, WebviewWindowBuilder, WindowEvent, menu::{Menu, MenuId, MenuItem}, tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}
};
use tauri::image::Image;

pub fn setup_tray(app: &AppHandle) -> Result<()> {
    let quit = MenuItem::with_id(
        app,
        MenuId::new("quit"),
        "Fechar",
        true,
        None::<&str>,
    )?;
    let config_item = MenuItem::with_id(
        app,
        MenuId::new("config"),
        "Configuração",
        true,
        None::<&str>,
    )?;
    let menu = Menu::with_items(app, &[&config_item, &quit])?;
    TrayIconBuilder::with_id("tray-main")
        .tooltip("TTD")
        .icon(Image::from_bytes(include_bytes!("../icons/tray_idle.png")).unwrap())
        .menu(&menu)
        .show_menu_on_left_click(false) // esquerdo NÃO abre menu
        .on_menu_event(|app, event| match event.id.as_ref() {
            "config" => {
                if let Some(window) = app.get_webview_window("Config") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }else {
                    if let Ok(window) = WebviewWindowBuilder::new(
                        app,
                        "Config",
                        WebviewUrl::App("config.html".into())
                    )
                    .title("Configuração")
                    .inner_size(500.0, 500.0)
                    .center()
                    .resizable(false)
                    .minimizable(false)
                    .maximizable(false)
                    .build() {
                        let window_clone = window.clone();
                        window.on_window_event(move |event| {
                            if let WindowEvent::CloseRequested { api, .. } = event {
                                api.prevent_close();
                                let _ = window_clone.hide();
                            }
                        });
                    }
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            let app = tray.app_handle();
            match event {
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    if let Some(window) = app.get_webview_window("Time") {
                        let _ = window.unminimize();
                        let _ = window.show();
                        let _ = window.set_focus();
                    } else {
                        let popup_width = 250.0;
                        let popup_height = 500.0;
                        let margin = 10.0;

                        let window = tauri::WebviewWindowBuilder::new(
                            app,
                            "Time",
                            tauri::WebviewUrl::App("index.html".into()),
                        )
                        .title("TraceTime")
                        .decorations(false)
                        .transparent(false)
                        .always_on_top(true)
                        .skip_taskbar(true)
                        .resizable(false)
                        .inner_size(popup_width, popup_height)
                        .visible(false)
                        .build()
                        .expect("failed to create popup window");

                        let monitor = window
                            .current_monitor()
                            .ok()
                            .flatten()
                            .expect("Nenhum monitor encontrado");

                        let work_area = monitor.work_area();
                        let size = window.outer_size().unwrap();

                        let x = work_area.position.x as f64
                            + work_area.size.width as f64
                            - size.width as f64
                            - margin;

                        let y = work_area.position.y as f64
                            + work_area.size.height as f64
                            - size.height as f64
                            - margin;

                        window
                            .set_position(tauri::PhysicalPosition::new(x as i32, y as i32))
                            .unwrap();

                        

                        let window_clone = window.clone();

                        window.on_window_event(move |event| {
                            if let tauri::WindowEvent::Focused(false) = event {
                                let _ = window_clone.hide();
                            }
                        });

                        
                        window.show().unwrap();
                        window.set_focus().unwrap();

                    }
                }
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

pub fn update_tray_icon(app: &tauri::AppHandle, status: &str) {
    if let Some(tray_handle) = app.tray_by_id("tray-main") {
        match status {
            "runner" => {
                let icon = Image::from_bytes(include_bytes!("../icons/tray_running.png")).unwrap();
                let _ = tray_handle.set_icon(Some(icon));
            }
            "pause" => {
                let icon = Image::from_bytes(include_bytes!("../icons/tray_pause.png")).unwrap();
                let _ = tray_handle.set_icon(Some(icon));
            }
            _ => {
                let icon = Image::from_bytes(include_bytes!("../icons/tray_idle.png")).unwrap();
                let _ = tray_handle.set_icon(Some(icon));
            }
        }
    }
}