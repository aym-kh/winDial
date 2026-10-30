import { Injectable } from "@angular/core";
import { invoke, isTauri } from "@tauri-apps/api/core";
import type { WheelConfig } from "../types";

@Injectable({ providedIn: "root" })
export class WheelConfigService {
  async load(): Promise<WheelConfig> {
    if (isTauri()) {
      return invoke<WheelConfig>("load_wheel_config");
    }

    const savedConfig = localStorage.getItem("windial.config");
    if (savedConfig !== null) {
      return JSON.parse(savedConfig) as WheelConfig;
    }

    const response = await fetch("assets/default-wheel-config.json");
    if (!response.ok) {
      throw new Error(
        `Could not load default wheel configuration (${response.status})`,
      );
    }

    return (await response.json()) as WheelConfig;
  }

  async save(config: WheelConfig): Promise<void> {
    if (isTauri()) {
      await invoke("save_wheel_config", { config });
      return;
    }

    localStorage.setItem("windial.config", JSON.stringify(config));
  }
}
