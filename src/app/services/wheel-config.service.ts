import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import type { WheelConfig } from "../types";

@Injectable({ providedIn: "root" })
export class WheelConfigService {
  load(): Promise<WheelConfig> {
    return invoke<WheelConfig>("load_wheel_config");
  }

  save(config: WheelConfig): Promise<void> {
    return invoke("save_wheel_config", { config });
  }
}
