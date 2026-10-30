import { Component, Input, OnChanges, SimpleChanges, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { WheelConfig } from "../../types";

@Component({
  selector: "app-settings-dialog",
  imports: [FormsModule],
  templateUrl: "./settings-dialog.component.html",
  styleUrl: "./settings-dialog.component.css",
})
export class SettingsDialogComponent implements OnChanges {
  @Input({ required: true }) config: WheelConfig | null = null;
  @Input() open = false;

  readonly save = output<WheelConfig>();
  readonly close = output<void>();

  draft: WheelConfig | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.open &&
      this.config !== null &&
      (changes["open"] || changes["config"])
    ) {
      this.draft = structuredClone(this.config);
    }
  }

  saveChanges(): void {
    if (this.draft !== null) {
      this.save.emit(this.draft);
    }
  }

  closeDialog(): void {
    this.close.emit();
  }
}
