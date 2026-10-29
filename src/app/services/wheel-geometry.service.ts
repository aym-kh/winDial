import { Injectable } from "@angular/core";
import type { WheelSector } from "../types";

@Injectable({ providedIn: "root" })
export class WheelGeometryService {
  createSectors(
    sliceCount: number,
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
  ): WheelSector[] {
    if (!Number.isInteger(sliceCount) || sliceCount < 1) {
      throw new RangeError("Slice count must be a positive integer");
    }

    if (
      ![centerX, centerY, innerRadius, outerRadius].every(Number.isFinite) ||
      innerRadius <= 0 ||
      outerRadius <= innerRadius
    ) {
      throw new RangeError("Wheel dimensions must be finite and valid");
    }

    const sliceAngle = 360 / sliceCount;

    return Array.from({ length: sliceCount }, (_, index) => {
      const startAngle = -90 + index * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const middleAngle = startAngle + sliceAngle / 2;
      const outerStart = this.point(centerX, centerY, outerRadius, startAngle);
      const innerStart = this.point(centerX, centerY, innerRadius, startAngle);
      const label = this.point(
        centerX,
        centerY,
        (innerRadius + outerRadius) / 2,
        middleAngle,
      );

      return {
        index,
        path: this.sectorPath(
          centerX,
          centerY,
          innerRadius,
          outerRadius,
          startAngle,
          endAngle,
          sliceAngle,
        ),
        labelX: label.x,
        labelY: label.y,
      };
    });
  }

  private sectorPath(
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    sliceAngle: number,
  ): string {
    if (sliceAngle === 360) {
      const halfAngle = startAngle + 180;
      const outerHalf = this.point(centerX, centerY, outerRadius, halfAngle);
      const outerStart = this.point(centerX, centerY, outerRadius, startAngle);
      const innerHalf = this.point(centerX, centerY, innerRadius, halfAngle);
      const innerStart = this.point(centerX, centerY, innerRadius, startAngle);

      return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${outerRadius} ${outerRadius} 0 1 1 ${outerHalf.x} ${outerHalf.y}`,
        `A ${outerRadius} ${outerRadius} 0 1 1 ${outerStart.x} ${outerStart.y}`,
        `L ${innerStart.x} ${innerStart.y}`,
        `A ${innerRadius} ${innerRadius} 0 1 0 ${innerHalf.x} ${innerHalf.y}`,
        `A ${innerRadius} ${innerRadius} 0 1 0 ${innerStart.x} ${innerStart.y}`,
        "Z",
      ].join(" ");
    }

    const outerStart = this.point(centerX, centerY, outerRadius, startAngle);
    const outerEnd = this.point(centerX, centerY, outerRadius, endAngle);
    const innerStart = this.point(centerX, centerY, innerRadius, startAngle);
    const innerEnd = this.point(centerX, centerY, innerRadius, endAngle);
    const largeArc = sliceAngle > 180 ? 1 : 0;

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  }

  private point(
    centerX: number,
    centerY: number,
    radius: number,
    angle: number,
  ): { x: number; y: number } {
    const radians = (angle * Math.PI) / 180;
    return {
      x: Number((centerX + radius * Math.cos(radians)).toFixed(3)),
      y: Number((centerY + radius * Math.sin(radians)).toFixed(3)),
    };
  }
}
