import { describe, expect, it } from "vitest";
import { StreetGame } from "../src/streets/game";
import {
  CONTACT,
  GARAGE,
  HOME,
  TAPE,
  angleDifference,
  distance,
  type Point,
} from "../src/streets/world";

function step(game: StreetGame, seconds: number, input = {}) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) game.update(1 / 60, input);
}
function walkTo(game: StreetGame, point: Point) {
  for (let i = 0; i < 1800; i++) {
    const view = game.view(),
      dx = point.x - view.player.x,
      dz = point.z - view.player.z,
      gap = Math.hypot(dx, dz);
    if (gap < 0.2) return;
    game.update(1 / 60, {
      forward:
        (Math.sin(view.cameraYaw) * dx + Math.cos(view.cameraYaw) * dz) / gap,
      side:
        (Math.cos(view.cameraYaw) * dx - Math.sin(view.cameraYaw) * dz) / gap,
      sprint: true,
    });
  }
  throw new Error(
    `Could not walk to ${JSON.stringify(point)}: ${JSON.stringify(game.view())}`,
  );
}
function driveTo(game: StreetGame, point: Point) {
  for (let i = 0; i < 3000; i++) {
    const view = game.view(),
      car = view.cars.find((c) => c.id === view.player.vehicle)!;
    const gap = distance(car, point),
      error = angleDifference(
        Math.atan2(point.x - car.x, point.z - car.z),
        car.yaw,
      );
    if (gap < 4.5 && Math.abs(car.speed) < 0.8) return;
    const desiredSpeed =
      gap < 4 ? 0 : Math.abs(error) > 0.3 ? 5 : Math.min(16, gap * 0.7);
    game.update(1 / 60, {
      forward:
        car.speed < desiredSpeed - 0.5
          ? 1
          : car.speed > desiredSpeed + 0.5
            ? -1
            : 0,
      side: Math.abs(error) < 0.035 ? 0 : Math.sign(error),
      brake: gap < 4,
    });
    if (view.phase === "failed")
      throw new Error(`Drive failed: ${JSON.stringify(view)}`);
  }
  throw new Error(
    `Could not drive to ${JSON.stringify(point)}: ${JSON.stringify(game.view())}`,
  );
}
function recoverTape(game: StreetGame) {
  game.command("start");
  walkTo(game, CONTACT);
  game.command("interact");
  expect(game.view().phase).toBe("fight");
  walkTo(game, { x: 0, z: 20 });
  step(game, 2, { aim: true, fire: true });
  expect(game.view().phase).toBe("tape");
  walkTo(game, TAPE);
  game.command("interact");
  expect(game.view().phase).toBe("escape");
}
function escapeWithCoupe(game: StreetGame) {
  recoverTape(game);
  walkTo(game, { x: 5, z: 41 });
  game.command("interact");
  expect(game.view().player.vehicle).toBe("wave-coupe");
  driveTo(game, { x: 0, z: 0 });
  driveTo(game, GARAGE);
  step(game, 3, { brake: true });
  expect(game.view().wanted, JSON.stringify(game.view())).toBe(0);
  expect(game.view().phase).toBe("return");
}

describe("third-person street controls", () => {
  it("moves relative to the camera and jumps with finite sprint stamina", () => {
    const game = new StreetGame();
    game.command("start");
    game.look(Math.PI / 2);
    for (let i = 0; i < 60; i++)
      game.update(1 / 60, { forward: 1, sprint: true });
    expect(game.view().player.x).toBeGreaterThan(3);
    expect(Math.abs(game.view().player.z + 4)).toBeLessThan(0.1);
    expect(game.view().stamina).toBeLessThan(100);
    game.command("jump");
    game.update(0.1, {});
    expect(game.view().player.y).toBeGreaterThan(0.2);
  });

  it("pauses every timer and clears aim while snapshots cannot mutate the world", () => {
    const game = new StreetGame();
    game.command("start");
    step(game, 0.1, { aim: true });
    game.command("pause");
    const paused = game.view();
    step(game, 1, { forward: 1, fire: true });
    expect(game.view()).toEqual(paused);
    expect(game.view().aiming).toBe(false);
    paused.player.x = 1000;
    paused.cars[0].health = 0;
    expect(game.view().player.x).toBe(0);
    expect(game.view().cars[0].health).toBe(100);
  });

  it("does not shoot enemies through a building and reloads from the finite reserve", () => {
    const game = new StreetGame();
    game.command("start");
    walkTo(game, { x: -44, z: -4 });
    walkTo(game, { x: -44, z: 22 });
    game.look(Math.PI / 2);
    step(game, 4, { aim: true, fire: true });
    expect(game.view().enemies.map((enemy) => enemy.health)).toEqual([3, 3]);
    expect(game.view().magazine).toBe(0);
    game.command("reload");
    step(game, 1.2);
    expect(game.view().magazine).toBe(12);
    expect(game.view().reserve).toBe(24);
  });

  it.each([
    [null, 850],
    ['{"version":1,"completed":false,"money":100000}', 100000],
  ] as const)(
    "completes and reloads the ordinary-control mission with starting save %s, rewarding once",
    (saved, expectedMoney) => {
      const game = new StreetGame(saved);
      escapeWithCoupe(game);
      driveTo(game, HOME);
      game.command("interact");
      expect(game.view().phase).toBe("complete");
      expect(game.view().completed).toBe(true);
      expect(game.view().money).toBe(expectedMoney);
      const reward = game.view().money;
      game.command("interact");
      expect(game.view().money).toBe(reward);
      const loaded = new StreetGame(game.save());
      expect(loaded.view().completed).toBe(true);
      expect(loaded.view().money).toBe(reward);
      loaded.command("start");
      loaded.command("retry");
      expect(loaded.view().money).toBe(reward);
    },
  );

  it("requires escaping renewed police attention before delivering the tape", () => {
    const game = new StreetGame();
    escapeWithCoupe(game);
    driveTo(game, { x: 0, z: 4 });
    game.command("interact");
    expect(game.view().player.vehicle).toBe(null);
    step(game, 0.02, { fire: true });
    expect(game.view().wanted).toBeGreaterThan(0);
    walkTo(game, HOME);
    game.command("interact");
    expect(game.view().completed).toBe(false);
    expect(game.view().phase).toBe("escape");
    expect(game.view().objective).toMatch(/lose the police/i);
  });

  it("keeps vehicle movement and camera finite when public axes contain invalid numbers", () => {
    const game = new StreetGame();
    game.command("start");
    walkTo(game, { x: 5, z: 41 });
    game.command("interact");
    expect(game.view().player.vehicle).toBe("wave-coupe");
    step(game, 1, { forward: 1 });
    const yaw = game.view().player.yaw;
    for (const invalid of [Infinity, -Infinity, NaN]) {
      game.update(1 / 60, { forward: invalid, side: invalid });
      const view = game.view();
      expect(
        [view.player.x, view.player.z, view.player.yaw, view.cameraYaw].every(
          Number.isFinite,
        ),
      ).toBe(true);
      expect(view.player.yaw).toBe(yaw);
    }
  });

  it("validates saves without importing old campaign progress", () => {
    for (const saved of [
      "oops",
      '{"version":1,"completed":4,"money":3650}',
      '{"version":1,"completed":true,"money":-2}',
    ]) {
      expect(new StreetGame(saved).view().completed).toBe(false);
      expect(new StreetGame(saved).view().money).toBe(200);
    }
  });
});
