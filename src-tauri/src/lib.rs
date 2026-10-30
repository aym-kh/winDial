// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct WheelConfig {
    version: u8,
    root: WheelLevel,
}

#[derive(Clone, Deserialize, Serialize)]
struct WheelLevel {
    slices: Vec<WheelSlice>,
}

#[derive(Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
enum WheelSliceKind {
    Action,
    Settings,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
enum WheelActionType {
    None,
    LaunchProcess,
    OpenUrl,
    Hotkey,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct WheelSlice {
    id: String,
    label: String,
    kind: WheelSliceKind,
    action_type: WheelActionType,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    children: Option<WheelLevel>,
}

fn default_wheel_config() -> WheelConfig {
    let labels = [
        "Browser",
        "Terminal",
        "Files",
        "Editor",
        "Copy",
        "Paste",
        "Desktop",
        "Task View",
    ];
    let mut root = WheelLevel {
        slices: labels
            .iter()
            .enumerate()
            .map(|(index, label)| WheelSlice {
                id: format!("action-{}", index + 1),
                label: (*label).to_string(),
                kind: WheelSliceKind::Action,
                action_type: WheelActionType::None,
                children: None,
            })
            .collect(),
    };
    ensure_settings_slice(&mut root);
    WheelConfig { version: 1, root }
}

fn ensure_settings_slice(level: &mut WheelLevel) {
    for slice in &mut level.slices {
        if let Some(children) = &mut slice.children {
            ensure_settings_slice(children);
        }
    }

    level
        .slices
        .retain(|slice| slice.kind != WheelSliceKind::Settings);
    level.slices.push(WheelSlice {
        id: "settings".to_string(),
        label: "Settings".to_string(),
        kind: WheelSliceKind::Settings,
        action_type: WheelActionType::None,
        children: None,
    });
}

fn wheel_config_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .app_config_dir()
        .map(|directory| directory.join("config.json"))
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn load_wheel_config(app: tauri::AppHandle) -> Result<WheelConfig, String> {
    let path = wheel_config_path(&app)?;
    if !path.exists() {
        let config = default_wheel_config();
        let json = serde_json::to_string_pretty(&config).map_err(|error| error.to_string())?;
        std::fs::create_dir_all(
            path.parent()
                .ok_or_else(|| "Wheel configuration path has no parent directory".to_string())?,
        )
        .map_err(|error| error.to_string())?;
        std::fs::write(&path, json).map_err(|error| error.to_string())?;
        return Ok(config);
    }

    let contents = std::fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let mut config: WheelConfig =
        serde_json::from_str(&contents).map_err(|error| error.to_string())?;
    if config.version != 1 {
        return Err(format!(
            "Unsupported wheel configuration version: {}",
            config.version
        ));
    }
    let original = serde_json::to_string(&config).map_err(|error| error.to_string())?;
    ensure_settings_slice(&mut config.root);
    let normalized = serde_json::to_string_pretty(&config).map_err(|error| error.to_string())?;
    if original != serde_json::to_string(&config).map_err(|error| error.to_string())? {
        std::fs::write(path, normalized).map_err(|error| error.to_string())?;
    }
    Ok(config)
}

#[tauri::command]
fn save_wheel_config(app: tauri::AppHandle, mut config: WheelConfig) -> Result<(), String> {
    if config.version != 1 {
        return Err(format!(
            "Unsupported wheel configuration version: {}",
            config.version
        ));
    }
    ensure_settings_slice(&mut config.root);
    let path = wheel_config_path(&app)?;
    std::fs::create_dir_all(
        path.parent()
            .ok_or_else(|| "Wheel configuration path has no parent directory".to_string())?,
    )
    .map_err(|error| error.to_string())?;
    let json = serde_json::to_string_pretty(&config).map_err(|error| error.to_string())?;
    std::fs::write(path, json).map_err(|error| error.to_string())
}

#[cfg(windows)]
mod mouse_hook {
    use std::sync::{
        OnceLock,
        atomic::{AtomicBool, Ordering},
    };

    use tauri::{AppHandle, Emitter, Manager, PhysicalPosition};
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
                release_wheel();
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

    fn release_wheel() {
        let Some(app) = APP_HANDLE.get().cloned() else {
            eprintln!("Cannot release wheel: Tauri app handle is unavailable");
            return;
        };

        if let Err(error) = app.emit("wheel-release", ()) {
            eprintln!("Failed to notify frontend about wheel release: {error}");
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
        .invoke_handler(tauri::generate_handler![
            greet,
            show_window,
            hide_window,
            load_wheel_config,
            save_wheel_config
        ])
        .setup(|app| {
            #[cfg(windows)]
            mouse_hook::install(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn settings_slice_is_present_once_at_each_level() {
        let nested = WheelLevel {
            slices: vec![WheelSlice {
                id: "nested-settings-old".to_string(),
                label: "Old settings".to_string(),
                kind: WheelSliceKind::Settings,
                action_type: WheelActionType::None,
                children: None,
            }],
        };
        let mut root = WheelLevel {
            slices: vec![
                WheelSlice {
                    id: "group".to_string(),
                    label: "Group".to_string(),
                    kind: WheelSliceKind::Action,
                    action_type: WheelActionType::None,
                    children: Some(nested),
                },
                WheelSlice {
                    id: "settings-a".to_string(),
                    label: "Settings".to_string(),
                    kind: WheelSliceKind::Settings,
                    action_type: WheelActionType::None,
                    children: None,
                },
                WheelSlice {
                    id: "settings-b".to_string(),
                    label: "Settings".to_string(),
                    kind: WheelSliceKind::Settings,
                    action_type: WheelActionType::None,
                    children: None,
                },
            ],
        };

        ensure_settings_slice(&mut root);

        let root_settings: Vec<_> = root
            .slices
            .iter()
            .filter(|slice| slice.kind == WheelSliceKind::Settings)
            .collect();
        let child_settings: Vec<_> = root.slices[0]
            .children
            .as_ref()
            .unwrap()
            .slices
            .iter()
            .filter(|slice| slice.kind == WheelSliceKind::Settings)
            .collect();

        assert_eq!(root_settings.len(), 1);
        assert_eq!(child_settings.len(), 1);
        assert_eq!(root_settings[0].id, "settings");
        assert_eq!(child_settings[0].id, "settings");
    }
}
