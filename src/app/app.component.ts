import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from "@angular/core";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { WheelComponent } from "./components/wheel/wheel.component";
import { SettingsDialogComponent } from "./components/settings-dialog/settings-dialog.component";
import { WheelConfigService } from "./services/wheel-config.service";
import type { WheelConfig, WheelSlice } from "./types";

@Component({
  selector: "app-root",
  imports: [WheelComponent, SettingsDialogComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit, OnDestroy {
  config: WheelConfig | null = null;
  activeSlice: WheelSlice | null = null;
  settingsOpen = false;
  readonly browserPreview = !isTauri();
  errorMessage: string | null = null;

  private readonly configService = inject(WheelConfigService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private unlistenRelease: UnlistenFn | null = null;

  async ngOnInit(): Promise<void> {
    document.documentElement.classList.toggle(
      "browser-preview",
      this.browserPreview,
    );

    try {
      this.config = await this.configService.load();
      this.changeDetector.markForCheck();
    } catch (error) {
      this.errorMessage = `Could not load wheel configuration: ${String(error)}`;
      console.error(this.errorMessage);
      this.changeDetector.markForCheck();
    }

    if (isTauri()) {
      try {
        this.unlistenRelease = await listen("wheel-release", () => {
          void this.handleWheelRelease();
        });
      } catch (error) {
        this.errorMessage = `Could not listen for wheel release: ${String(error)}`;
        console.error(this.errorMessage);
        this.changeDetector.markForCheck();
      }
    }
  }

  onSliceRelease(slice: WheelSlice | null): void {
    if (this.browserPreview && slice?.kind === "settings") {
      this.settingsOpen = true;
      this.changeDetector.markForCheck();
    }
  }

  async saveConfig(config: WheelConfig): Promise<void> {
    try {
      await this.configService.save(config);
      this.config = config;
      this.errorMessage = null;
      this.changeDetector.markForCheck();
    } catch (error) {
      this.errorMessage = `Could not save wheel configuration: ${String(error)}`;
      console.error(this.errorMessage);
      this.changeDetector.markForCheck();
    }
  }

  closeSettings(): void {
    this.settingsOpen = false;
    if (isTauri()) {
      void this.hideWindow();
    }
  }

  private async handleWheelRelease(): Promise<void> {
    if (this.activeSlice?.kind === "settings") {
      this.settingsOpen = true;
      this.changeDetector.markForCheck();
      return;
    }

    await this.hideWindow();
  }

  private async hideWindow(): Promise<void> {
    try {
      await invoke("hide_window");
    } catch (error) {
      this.errorMessage = `Could not hide the wheel: ${String(error)}`;
      console.error(this.errorMessage);
      this.changeDetector.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.unlistenRelease?.();
    document.documentElement.classList.remove("browser-preview");
  }
}
