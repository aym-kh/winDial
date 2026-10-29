import { Component, Input, OnChanges, SimpleChanges, inject } from "@angular/core";
import { WheelGeometryService } from "../services/wheel-geometry.service";
import type { WheelSector } from "../types";

@Component({
  selector: "app-wheel",
  templateUrl: "./wheel.component.html",
  styleUrl: "./wheel.component.css",
})
export class WheelComponent implements OnChanges {
  @Input() sliceCount = 8;

  sectors: WheelSector[] = [];
  readonly viewBox = "0 0 600 600";

  private readonly geometry = inject(WheelGeometryService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["sliceCount"]) {
      this.sectors = this.geometry.createSectors(
        this.sliceCount,
        300,
        300,
        102,
        276,
      );
    }
  }
}
