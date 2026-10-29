// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;

#[cfg(windows)]
mod mouse_hook {
    use std::sync::{
        OnceLock,
        atomic::{AtomicBool, Ordering},
    };

    use tauri::{AppHandle, Manager, PhysicalPosition};
    use windows_sys::Win32::{
        System::LibraryLoader::GetModuleHandleW,
        UI::{
            Input::KeyboardAndMouse::{GetAsyncKeyState, VK_MENU},
            WindowsAndMessaging::{
                CallNextHookEx, HC_ACTION, MSLLHOOKSTRUCT, SetWindowsHookExW, UnhookWindowsHookEx,
                WH_MOUSE_LL, WM_RBUTTONDOWN, WM_RBUTTONUP,
            },
        },
    };

    static APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();
    static ACTIVATION_HELD: AtomicBool = AtomicBool::new(false);

    struct MouseHook(usize);

    impl Drop for MouseHook {
        fn drop(&mut self) {
            let result = unsafe { UnhookWindowsHookEx(self.0 as _) };
            if result == 0 {
                eprintln!(
                    "Failed to unregister the global mouse hook: {}",
                    std::io::Error::last_os_error()
                );
            }
        }
    }

    pub fn install(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
        APP_HANDLE.set(app.handle().clone()).map_err(|_| {
            std::io::Error::new(
                std::io::ErrorKind::AlreadyExists,
                "Mouse hook app handle was already initialized",
            )
        })?;

        let module = unsafe { GetModuleHandleW(std::ptr::null()) };
        let hook = unsafe { SetWindowsHookExW(WH_MOUSE_LL, Some(mouse_hook_proc), module, 0) };
        if hook.is_null() {
            return Err(Box::new(std::io::Error::last_os_error()));
        }

        if !app.manage(MouseHook(hook as usize)) {
            return Err(Box::new(std::io::Error::new(
                std::io::ErrorKind::AlreadyExists,
                "Global mouse hook is already registered",
            )));
        }

        Ok(())
    }

    unsafe extern "system" fn mouse_hook_proc(code: i32, message: usize, data: isize) -> isize {
        if code == HC_ACTION as i32 {
            let mouse = unsafe { &*(data as *const MSLLHOOKSTRUCT) };
            if message == WM_RBUTTONDOWN as usize && unsafe { GetAsyncKeyState(VK_MENU as i32) } < 0
            {
                if !ACTIVATION_HELD.swap(true, Ordering::SeqCst) {
                    show_at_cursor(mouse.pt.x, mouse.pt.y);
                }
                return 1;
            }

            if message == WM_RBUTTONUP as usize && ACTIVATION_HELD.swap(false, Ordering::SeqCst) {
                hide_overlay();
                return 1;
            }
        }

        unsafe { CallNextHookEx(std::ptr::null_mut(), code, message, data) }
    }

    fn show_at_cursor(x: i32, y: i32) {
        let Some(app) = APP_HANDLE.get().cloned() else {
            eprintln!("Cannot show overlay: Tauri app handle is unavailable");
            return;
        };

        let window_app = app.clone();
        if let Err(error) = app.run_on_main_thread(move || {
            let result = (|| {
                let window = window_app
                    .get_webview_window("main")
                    .ok_or_else(|| "Main window not found".to_string())?;
                let size = window.outer_size().map_err(|error| error.to_string())?;
                window
                    .set_position(PhysicalPosition::new(
                        x - size.width as i32 / 2,
                        y - size.height as i32 / 2,
                    ))
                    .map_err(|error| error.to_string())?;
                window.show().map_err(|error| error.to_string())
            })();

            if let Err(error) = result {
                eprintln!("Failed to show overlay: {error}");
            }
        }) {
            eprintln!("Failed to schedule overlay display: {error}");
        }
    }

    fn hide_overlay() {
        let Some(app) = APP_HANDLE.get().cloned() else {
            eprintln!("Cannot hide overlay: Tauri app handle is unavailable");
            return;
        };

        let window_app = app.clone();
        if let Err(error) = app.run_on_main_thread(move || {
            let result = window_app
                .get_webview_window("main")
                .ok_or_else(|| "Main window not found".to_string())
                .and_then(|window| window.hide().map_err(|error| error.to_string()));

            if let Err(error) = result {
                eprintln!("Failed to hide overlay: {error}");
            }
        }) {
            eprintln!("Failed to schedule overlay hide: {error}");
        }
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn show_window(app: tauri::AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?
        .show()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn hide_window(app: tauri::AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?
        .hide()
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, show_window, hide_window])
        .setup(|app| {
            #[cfg(windows)]
            mouse_hook::install(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
