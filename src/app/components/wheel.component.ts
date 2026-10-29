import { Component, Input, OnChanges, SimpleChanges, inject, output, } from "@angular/core";
import { WheelGeometryService } from "../services/wheel-geometry.service";
import { AudioFeedbackService } from "../services/audio-feedback.service";
import type { WheelSector } from "../types";

const CENTER = 300;
const OUTER_RADIUS = 276;

@Component({
  selector: "app-wheel",
  templateUrl: "./wheel.component.html",
  styleUrl: "./wheel.component.css",
})
export class WheelComponent implements OnChanges {
  @Input() sliceCount = 8;
  @Input() deadZoneRadius = 102;

  sectors: WheelSector[] = [];
  readonly viewBox = "0 0 600 600";
  activeSliceChange = output<number | null>();
  activeSlice: number | null = null;

  private readonly geometry = inject(WheelGeometryService);
  private readonly audioFeedback = inject(AudioFeedbackService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["sliceCount"]) {
      this.sectors = this.geometry.createSectors(
        this.sliceCount,
        CENTER,
        CENTER,
        102,
        OUTER_RADIUS,
      );
      this.setActiveSlice(null);
    }
  }

  onPointerMove(event: PointerEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const bounds = svg.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) {
      this.setActiveSlice(null);
      return;
    }

    const pointerX = ((event.clientX - bounds.left) / bounds.width) * 600;
    const pointerY = ((event.clientY - bounds.top) / bounds.height) * 600;

    this.setActiveSlice(
      this.geometry.getSliceAtPointer(
        pointerX - CENTER,
        pointerY - CENTER,
        this.sliceCount,
        this.deadZoneRadius,
        OUTER_RADIUS,
      ),
    );
  }

  onPointerLeave(): void {
    this.setActiveSlice(null);
  }

  private setActiveSlice(slice: number | null): void {
    if (slice !== this.activeSlice) {
      this.activeSlice = slice;
      this.activeSliceChange.emit(slice);
      if (slice !== null) {
        this.audioFeedback.playHoverTick();
      }
    }
  }

  get hubLabel(): string {
    return this.activeSlice === null
      ? "READY"
      : `SLICE ${this.activeSlice + 1}`;
  }
}
