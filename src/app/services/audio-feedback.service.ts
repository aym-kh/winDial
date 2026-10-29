import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class AudioFeedbackService {
  private readonly hoverTick = new Audio(
    "assets/audio/turning_pages-soft-ui-hover-tick-608625.mp3",
  );

  constructor() {
    this.hoverTick.preload = "auto";
    this.hoverTick.volume = 0.35;
  }

  playHoverTick(): void {
    this.hoverTick.currentTime = 0;
    void this.hoverTick.play().catch((error: unknown) => {
      console.error("Failed to play wheel hover sound:", error);
    });
  }
}
