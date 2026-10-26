# WinDial — Technical & Architectural Roadmap

This document serves as the implementation blueprint for WinDial. AI assistants and contributors should reference this roadmap to understand feature progression, architectural dependencies, and task ordering.

---

## 🎯 Versioning & Scope Strategy

WinDial follows a phased release strategy:
- **v0.1.x:** Core Desktop Overlay Engine (Basic Wheel, Math, Hotkeys, Launching).
- **v0.2.x:** Interaction Polish & Ergonomics (Flick Mode, Haptics, Sound Effects).
- **v0.3.x:** Config Persistence & Settings UI (JSON Schema, Visual Loadout Builder).
- **v0.4.x:** Context-Awareness & OS Integration (Foreground Process Detection, Dynamic Wheels).
- **v0.5.x:** Advanced System Actions & Power Tools (Window Snapping, Snippets, Media).
- **v1.0.0:** Production Release (Auto-launch, Native Performance Optimization, Extensibility).

---

## 🗺️ Implementation Phases

### Phase 1: Engine Foundation & Window Mechanics (`v0.1.0`)
*Goal: Create a transparent, floating Tauri window triggered by a global shortcut.*

- [ ] **Tauri Window Management:**
  - Configure `tauri.conf.json` for transparent, frameless, always-on-top, and non-resizable window bounds.
  - Implement Rust IPC commands to hide/show window on demand.
- [ ] **Global Hotkey Integration:**
  - Register a system-wide hotkey listener using Rust (e.g., `Alt + RightClick` or `Win + Z`).
  - Move window bounds to current cursor `(X, Y)` position before displaying.
- [ ] **Basic Angular Wheel Component:**
  - Build dynamic SVG arc math service in Angular to calculate $N$ slices based on slice count.
  - Center hub / dead-zone layout.

---

### Phase 2: Slice Trigonometry & Interaction Engine (`v0.1.5` – `v0.2.0`)
*Goal: Turn raw mouse coordinates into precise wedge selection with flick mechanics.*

- [ ] **Angle & Distance Calculation:**
  - Track relative mouse position $(dx, dy)$ relative to center hub $(0,0)$.
  - Calculate distance $R = \sqrt{dx^2 + dy^2}$.
  - Compute angle $\theta = \text{atan2}(dy, dx)$ converted to normalized degrees $[0, 360)$.
- [ ] **Dead-Zone Logic:**
  - If $R < \text{deadZoneRadius}$, set state to `NEUTRAL` (cancels trigger on release).
- [ ] **Flick & Release Execution:**
  - Track mouse velocity vector.
  - Execute highlighted slice action upon releasing hotkey/mouse button.
- [ ] **Visual & Audio Feedback:**
  - Highlight active wedge slice with smooth SCSS/CSS transform scale/glow.
  - Add low-latency tick sound effect on wedge change.

---

### Phase 3: Action Dispatcher & Core System Capabilities (`v0.2.5`)
*Goal: Allow slices to actually execute useful tasks on Windows.*

- [ ] **Rust Action Executor System:**
  - `launch_process`: Execute target `.exe` or command (e.g., `wt.exe`, `code`).
  - `open_url`: Open web link in default browser.
  - `emulate_hotkey`: Simulate keystrokes using Rust native API (e.g., `Ctrl + C`, `Win + D`).
- [ ] **Sub-Wheel Navigation:**
  - Allow a wedge to spawn a secondary inner/outer wheel (e.g., *Apps* $\rightarrow$ *Media*).

---

### Phase 4: Configuration & Settings UI (`v0.3.0`)
*Goal: Enable full end-user customization via JSON file and a dedicated visual builder.*

- [ ] **JSON State Service (`config.json`):**
  - Read/write schema in `%APPDATA%/windial/config.json`.
  - Expose Tauri IPC methods to fetch and save configuration.
- [ ] **Angular Settings Window:**
  - Separate app route/window for settings management.
  - Sensitivity sliders (dead-zone radius, theme selector, sound volume).
- [ ] **Visual Wheel Builder:**
  - Drag-and-drop wedge editor to customize icons (Lucide SVG collection), labels, and targets.

---

### Phase 5: Context Awareness Engine (`v0.4.0`)
*Goal: Dynamically switch wheel loadouts depending on active foreground application.*

- [ ] **Foreground Process Listener:**
  - Implement Windows API hook in Rust (`GetForegroundWindow` + `GetWindowThreadProcessId`) to retrieve current `.exe` name (e.g., `code.exe`, `explorer.exe`).
- [ ] **Dynamic Wheel Swapping:**
  - Match active process against user mappings in `config.json`.
  - Swap active Angular wheel payload instantly prior to displaying overlay.

---

### Phase 6: Advanced Windows Integration (`v0.5.0`+)
*Goal: High-value built-in loadouts for desktop power users.*

- [ ] **Window Snapping Engine:**
  - Native Rust calls to resize active window (Left Half, Right Half, Top Half, Maximize, Pin on Top).
- [ ] **Text Casing & Snippets Module:**
  - Transform highlighted text (UPPERCASE, lowercase, camelCase) via clipboard injection.
- [ ] **Media & System Toggles:**
  - Quick audio output switching (Speakers vs. Headphones), volume wheel, microphone mute toggle.

---

## 🤖 Instructions for AI Assistants

1. Work strictly in sequential phase order unless explicitly directed otherwise.
2. Keep low-level mouse hooks in Rust to minimize frontend rendering latency.
3. Ensure all dynamic calculations in Angular utilize pure functions or RxJS pipes for $60\text{ fps}$ smoothness.