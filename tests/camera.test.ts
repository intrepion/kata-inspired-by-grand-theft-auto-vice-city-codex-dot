import { describe, it, expect } from "vitest";
import { cameraFraction } from "../src/streets/world";
describe("street camera collision", () => {
  it("stops before a building, clears a roof, and respects district bounds", () => {
    expect(
      cameraFraction({ x: 0, y: 2, z: 22 }, { x: 30, y: 2, z: 22 }),
    ).toBeLessThan(0.4);
    expect(
      cameraFraction({ x: 0, y: 20, z: 22 }, { x: 30, y: 20, z: 22 }),
    ).toBe(1);
    expect(
      cameraFraction({ x: 74, y: 2, z: 0 }, { x: 84, y: 2, z: 0 }),
    ).toBeLessThan(0.2);
  });
});
