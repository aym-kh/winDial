# WindDial (Windows Radial Overlay Utility)

## 1. Executive Summary & Vision

**WindDial** is a high-performance, context-aware radial (wheel) menu overlay designed for Windows 11/10. Inspired by gaming radial menus (e.g., *Rust*, *GTA V*, *Overwatch*), it provides muscle-memory-driven interactions via mouse flicking, hotkeys, and context-sensitive action loadouts. Built using **Tauri v2 (Rust backend)** and an **Angular frontend**, it offers near-zero overhead, sleek modern aesthetics, and deep customization.

## 2. Core Features & Use Cases

### A. Context-Aware Modes

The overlay dynamically adjusts its layout based on the active application, foreground window, or triggering gesture:

1. **File Explorer / Desktop Context:**
   * Quick file actions (Copy Path, Rename, Delete, Git Commit/Push, Open in Terminal).
   * File creation presets (New `.json`, `.md`, `.tsx`, etc.).

2. **Text & Code Editor Context (VS Code, JetBrains, Browsers):**
   * Code formatting, diff tools, text casing toggles (UPPERCASE, camelCase).
   * Snippet insertion and clipboard manager.

3. **Media & System Controls:**
   * Volume adjustment, play/pause, media track navigation, default audio output toggle.

4. **Window Management & Snapping:**
   * Flick-to-snap window controls (Left Half, Right Half, Maximize, Pin on Top, Minimize).

5. **App & Tool Launcher (Global Default):**
   * Instant app switching/launching (Terminal, VS Code, Browser, Spotify, Discord).

### B. Interaction Model & Ergonomics

* **Flick-and-Release:** Press modifier key / hotkey, swipe mouse directionally toward a wedge, and release to execute without explicit clicking.
* **Dead-Zone Center:** Hovering in the center hub acts as a neutral zone; releasing inside the dead-zone cancels the gesture.
* **Multi-Tier Nesting:** Expanding wedges for secondary options (e.g., *Apps* $\rightarrow$ *Communication Apps*).
* **Audio & Visual Haptics:** Subtle audio ticks and scale/glow animations on slice transitions.

---

## 3. Settings Panel UI & Configuration Management

To ensure users can personalize every aspect of WindDial without editing raw code, the application includes a standalone **Settings Panel UI** accessible via the system tray or a dedicated wedge action.

### A. Settings Panel UI Features
* **Visual Loadout Builder:** Drag-and-drop wedge editor to organize actions, select Lucide/Tabler SVG icons, and assign color accents per loadout.
* **Hotkeys & Trigger Configurator:** Easily map global triggers (e.g., `Alt + Right Click`, `Win + Z`, or extra mouse side buttons).
* **Behavior & Ergonomics Settings:**
  * Dead-zone radius slider.
  * Flick sensitivity & release-to-trigger toggles.
  * Audio click/tick feedback volume and theme toggle (Dark Glass, OLED Black, Acrylic Light).
* **Process Mapping:** Map executable names (e.g., `chrome.exe`, `idea64.exe`) directly to specific custom loadout wheels.

### B. JSON Schema & Storage Architecture
All preferences and custom loadouts are persisted in a local `%APPDATA%/radial-flow/config.json` file. The Angular UI binds directly to this model, sending live updates to the Rust backend via Tauri IPC commands.

```json
{
  "settings": {
    "global_trigger": "Alt + MouseRight",
    "deadzone_radius_px": 60,
    "outer_radius_px": 200,
    "flick_mode": true,
    "audio_haptics": true,
    "theme": "dark_acrylic"
  },
  "process_mappings": {
    "code.exe": "vscode_loadout",
    "explorer.exe": "file_explorer_loadout"
  },
  "loadouts": {
    "default_launcher": {
      "name": "Global Apps",
      "center_label": "APPS",
      "slices": [
        {
          "id": "terminal",
          "label": "Terminal",
          "icon": "terminal",
          "action_type": "launch_process",
          "target": "wt.exe"
        },
        {
          "id": "vscode",
          "label": "VS Code",
          "icon": "code",
          "action_type": "launch_process",
          "target": "code"
        },
        {
          "id": "volume_sub",
          "label": "Media",
          "icon": "volume-2",
          "action_type": "open_subwheel",
          "target": "media_controls_loadout"
        }
      ]
    }
  }
}
```

---

## 4. Technology Stack

* **Backend / Desktop Engine:**
  * **Tauri v2:** Ultra-lightweight system integration.
  * **Rust:** Global keyboard/mouse hooks (`rdev` or Windows API `SetWindowsHookEx`), foreground window detection (`winapi` / `windows-rs`), system tray, and hotkey listeners.

* **Frontend UI:**
  * **Angular:** Reactive state management, dynamic SVG wedge path math, smooth transition loops.
  * **Tailwind CSS / SCSS:** High-contrast, glassmorphism UI styling (acrylic dark mode / solid high contrast).

* **Configuration:**
  * **JSON / TOML:** User loadout configurations, shortcut mappings, and custom execution scripts.

---

## 5. Architecture Diagram & Workflow

```
+-----------------------------------------------------------------------+
|                             RUST BACKEND                              |
|  +------------------------+   +-------------------+  +-------------+  |
|  | Global Hotkey / Hooks  |   | Active Window     |  | Config /    |  |
|  | (Mouse Flick Detection)|   | Context Listener  |  | IPC State   |  |
|  +-----------+------------+   +---------+---------+  +------+------+  |
+--------------|--------------------------|-------------------|---------+
               |                          |                   |
               +-------------------+------v-------------------+
                                   | Tauri IPC Channel
                                   v
+-----------------------------------------------------------------------+
|                          ANGULAR FRONTEND                             |
|  +------------------------+   +-------------------+  +-------------+  |
|  | Radial Overlay &       |   | Settings Panel    |  | Audio/Visual|  |
|  | Dynamic SVG Rendering  |   | Visual Builder    |  | Feedback    |  |
|  +------------------------+   +-------------------+  +-------------+  |
+-----------------------------------------------------------------------+
```

---

## 6. Technical Roadmap & Implementation Steps

### Phase 1: Engine Core (Rust & Tauri Setup)
* [x] Setup Tauri v2 project with Angular frontend template.
* [x] Implement global hotkey registration (e.g., `Alt + Right Click` or `Win + Z`).
* [x] Configure transparent, borderless, always-on-top window positioning at mouse cursor coordinates.
* [ ] Rust IPC command to detect the active window process name (e.g., `code.exe`, `explorer.exe`).

### Phase 2: Frontend Wheel Math & UI Engine
* [x] Build dynamic SVG wedge generator in Angular based on wedge count ($N$ slices).
* [x] Implement trigonometric hover detection ($\theta = \text{atan2}(y, x)$) relative to dead-zone radius.
* [ ] Add basic open/close enter-and-exit animations.
* [x] Implement active slice highlight states and sound effect triggers.

### Phase 3: Action Execution System
* [ ] Build action dispatch system in Rust:
  * Key combo emulation (e.g., sending `Ctrl + C`, `Win + Left`).
  * Process spawning (launching `.exe` binaries).
  * System API calls (Volume up/down, window minimization).
* [ ] Connect Angular slice selection to IPC execution trigger upon key/mouse release.

### Phase 4: Context Awareness & Multi-Tier Wheels
* [ ] Automatic wheel layout swapping based on active process context.
* [ ] Implement nested inner/outer wheel navigation for multi-tier loadouts.

### Phase 5: Configuration & Settings Panel UI
* [ ] Implement Rust backend JSON file read/write service for `%APPDATA%/radial-flow/config.json`.
* [ ] Build Settings Window UI in Angular (Hotkeys, Sensitivity Sliders, Theme Selectors).
* [ ] Build visual drag-and-drop wedge editor for custom loadouts and process mapping.

---

## 7. Mathematical Model for Slices

To cleanly compute $N$ slice SVG paths dynamically in Angular:

$$
\theta_{\text{step}} = \frac{2\pi}{N}
$$

$$
\text{Start Angle } \theta_1 = i \cdot \theta_{\text{step}} - \frac{\pi}{2}, \quad \text{End Angle } \theta_2 = (i + 1) \cdot \theta_{\text{step}} - \frac{\pi}{2}
$$

Given inner radius $R_1$ and outer radius $R_2$, Cartesian coordinates for arc boundaries:

$$
x = R \cdot \cos(\theta), \quad y = R \cdot \sin(\theta)
$$

---

## 8. Guidelines for AI Assistants & LLMs

When generating code or modifications for this project:

1. **Performance First:** Keep Rust hooks lean; perform visual angle tracking inside the Angular renderer via `requestAnimationFrame` or reactive RxJS streams.
2. **Modular Slices:** Design the Angular wedge components so they accept arbitrary icon components, labels, and actions dynamically from state.
3. **Windows Native Feel:** Maintain high contrast, clean typography, dynamic transparency (`acrylic` or `mica` where supported), and minimal latency.