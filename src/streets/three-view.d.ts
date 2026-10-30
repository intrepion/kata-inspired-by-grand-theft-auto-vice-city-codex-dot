import type { StreetView } from "./game";
export function createStreetThree(canvas: HTMLCanvasElement): {
  render(view: StreetView, width: number, height: number): void;
  dispose(): void;
};
