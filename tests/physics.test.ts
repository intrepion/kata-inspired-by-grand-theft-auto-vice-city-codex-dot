import { describe, it, expect } from "vitest";
import { Game } from "../src/game";
import { solid, distance, SAFE } from "../src/city";
function car() {
  const g = new Game();
  g.command("interact");
  g.command("interact");
  return g;
}
function tick(
  g: Game,
  time: number,
  input: Parameters<Game["update"]>[1],
  hz = 60,
) {
  for (let i = 0; i < time * hz; i++) g.update(1 / hz, input);
}
describe("arcade physics and transitions", () => {
  it("driving distance is stable across 30/60/120Hz", () => {
    const points = [30, 60, 120].map((hz) => {
      const g = car();
      tick(g, 1, { up: true }, hz);
      return g.view().player;
    });
    expect(distance(points[0], points[2])).toBeLessThan(1);
    expect(points[0].y).toBeLessThan(1000);
  });
  it("speed cannot tunnel through the city boundary even after a frame stall", () => {
    const g = car();
    tick(g, 10, { up: true }, 30);
    g.update(10, { up: true });
    expect(solid(g.view().player.x, g.view().player.y, 18)).toBe(false);
    expect(g.view().player.y).toBeGreaterThanOrEqual(93);
  });
  it("brakes stop the car; reverse moves behind it; a fast exit is refused", () => {
    const g = car();
    tick(g, 1, { up: true });
    g.command("interact");
    expect(g.view().player.vehicle).toBe("loaner");
    tick(g, 1, { brake: true });
    expect(Math.abs(g.view().cars[0].speed)).toBeLessThan(1);
    const y = g.view().player.y;
    tick(g, 1, { down: true });
    expect(g.view().player.y).toBeGreaterThan(y + 60);
    tick(g, 1, { brake: true });
    g.command("interact");
    expect(g.view().player.vehicle).toBeNull();
    expect(solid(g.view().player.x, g.view().player.y, 9)).toBe(false);
  });
  it("recovery rescues the courier, fails only the active job and provides a repaired loaner", () => {
    const g = car();
    tick(g, 7, { up: true });
    g.command("recover");
    expect(g.view().player).toMatchObject(SAFE);
    expect(g.view().player.vehicle).toBeNull();
    expect(g.view().failed).toBe(true);
    expect(g.view().cars[0].health).toBe(100);
    g.command("retry");
    expect(g.view().active).toBe(true);
    expect(g.view().stage).toBe(0);
  });
  it("pause refuses movement, retry, recovery and interaction", () => {
    const g = car();
    g.command("pause");
    const before = g.view();
    tick(g, 1, { up: true, right: true });
    g.command("recover");
    g.command("interact");
    g.command("retry");
    expect(g.view()).toEqual(before);
    g.command("pause");
    tick(g, 1, { up: true });
    expect(g.view().player.y).toBeLessThan(before.player.y);
  });
  it("observations cannot mutate actual occupancy, money or bodywork", () => {
    const g = car(),
      s = g.view();
    s.player.vehicle = "invalid";
    s.money = 999;
    s.cars[0].health = -1;
    expect(g.view().player.vehicle).toBe("loaner");
    expect(g.view().money).toBe(0);
    expect(g.view().cars[0].health).toBe(100);
  });
});
it("lane traffic and patrols leave room around a stopped occupied car", () => {
  const g = car();
  let closest = 1000;
  for (let i = 0; i < 12000; i++) {
    g.update(1 / 120);
    const s = g.view();
    for (const c of s.cars.filter((c) => c.kind === "traffic"))
      closest = Math.min(closest, distance(c, s.player));
  }
  expect(closest).toBeGreaterThan(45);
});
it("on-foot movement cannot enter a building and invalid timesteps do nothing", () => {
  const g = new Game();
  tick(g, 2, { up: true });
  tick(g, 2, { right: true });
  expect(g.view().player.x).toBeLessThanOrEqual(236);
  expect(solid(g.view().player.x, g.view().player.y, 9)).toBe(false);
  const before = g.view();
  g.update(NaN, { right: true });
  g.update(-1, { right: true });
  expect(g.view()).toEqual(before);
});
it("steering into buildings is blocked in every movement substep", () => {
  const g = car();
  tick(g, 0.4, { up: true });
  for (let i = 0; i < 240; i++) {
    g.update(1 / 120, { up: true, right: true });
    expect(solid(g.view().player.x, g.view().player.y, 18)).toBe(false);
  }
  expect(g.view().cars[0].health).toBeLessThan(100);
});
