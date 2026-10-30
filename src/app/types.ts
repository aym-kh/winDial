export interface WheelSector {
  readonly index: number;
  readonly path: string;
  readonly labelX: number;
  readonly labelY: number;
}

export type WheelActionType =
  | "none"
  | "launch_process"
  | "open_url"
  | "hotkey";

export interface WheelLevel {
  slices: WheelSlice[];
}

export interface WheelSlice {
  id: string;
  label: string;
  kind: "action" | "settings";
  actionType: WheelActionType;
  children?: WheelLevel;
}

export interface WheelConfig {
  version: 1;
  root: WheelLevel;
}