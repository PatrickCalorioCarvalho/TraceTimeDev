
use tauri::{
    AppHandle, Manager, PhysicalPosition, Result, menu::{Menu, MenuId, MenuItem}, tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}
};

pub fn setup_tray(app: &AppHandle) -> Result<()> {
    // =========================
    // MENU (botão direito)
    // =========================
    let quit = MenuItem::with_id(
        app,
        MenuId::new("quit"),
        "Fechar",
        true,
        None::<&str>,
    )?;

    let menu = Menu::with_items(app, &[&quit])?;

    // =========================
    // TRAY ICON
    // =========================
    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false) // esquerdo NÃO abre menu
        .on_menu_event(|app, event| {
            if event.id().as_ref() == "quit" {
                app.exit(0);
            }
        })
        .on_tray_icon_event(|tray, event| {
            let app = tray.app_handle();
            match event {
                // CLIQUE ESQUERDO → POPUP
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    if let Some(window) = app.get_webview_window("projects") {
                        let _ = window.unminimize();
                        let _ = window.show();
                        let _ = window.set_focus();
                    } else {

                        let monitor = app
                            .primary_monitor()
                            .ok().flatten()
                            .expect("Nenhum monitor encontrado");

                        // resolução total do monitor
                        let monitor_size = monitor.size();
                        let monitor_x = monitor.position().x as f64;
                        let monitor_y = monitor.position().y as f64;

                        let popup_width = 250.0;
                        let popup_height = 500.0;

                        let x = monitor_x + monitor_size.width as f64 - popup_width * (2.65 as f64);
                        let y = monitor_y + monitor_size.height as f64 - popup_height * (1.55 as f64);

                        println!("Monitor size: {:?}", monitor_size);
                        println!("Popup position: x: {}, y: {}", x, y);
                        let position_monitor = PhysicalPosition::new(x, y);
                        let window = tauri::WebviewWindowBuilder::new(
                            app,
                            "projects",
                            tauri::WebviewUrl::App("index.html".into()),
                        )
                        .title("TraceTime")
                        .decorations(false)
                        .transparent(false)
                        .always_on_top(true)
                        .skip_taskbar(true)
                        .resizable(false)
                        .inner_size(popup_width, popup_height)
                        .position(position_monitor.x, position_monitor.y)
                        .visible(true)
                        .build()
                        .expect("failed to create popup window");
                        let window_clone = window.clone();

                        window.on_window_event(move |event| {
                            if let tauri::WindowEvent::Focused(false) = event {
                                let _ = window_clone.hide();
                            }
                        });

                        let _ = window.set_focus();
                    }
                }

                // CLIQUE DIREITO → abre menu automaticamente
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}
