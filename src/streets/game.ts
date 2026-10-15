import {
  BOUNDS,
  CONTACT,
  GARAGE,
  HOME,
  TAPE,
  angleDifference,
  blocked,
  distance,
  nearestNode,
  nodes,
  sight,
  towardNode,
  type Point,
} from "./world";

export type StreetInput = {
  forward?: number;
  side?: number;
  sprint?: boolean;
  aim?: boolean;
  fire?: boolean;
  brake?: boolean;
};
export type Vehicle = Point & {
  id: string;
  yaw: number;
  speed: number;
  health: number;
  kind: "coupe" | "traffic" | "police";
  color: string;
  node: number;
  goal: number;
};
export type Enemy = Point & { id: number; health: number; cooldown: number };
export type Phase =
  | "contact"
  | "fight"
  | "tape"
  | "escape"
  | "return"
  | "complete"
  | "failed";
export type StreetView = {
  player: Point & { y: number; yaw: number; vehicle: string | null };
  cars: Vehicle[];
  enemies: Enemy[];
  cameraYaw: number;
  aiming: boolean;
  targetEnemy: number | null;
  health: number;
  stamina: number;
  magazine: number;
  reserve: number;
  reload: number;
  weapon: "fists" | "pistol";
  wanted: number;
  unseen: number;
  bust: number;
  garageTime: number;
  money: number;
  completed: boolean;
  phase: Phase;
  started: boolean;
  paused: boolean;
  elapsed: number;
  message: string;
  objective: string;
  target: Point;
  traces: { from: Point; to: Point; life: number; hostile: boolean }[];
};
const MAX_CASH = 100000;
const axis = (value = 0) =>
  Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
const objectives: Record<Phase, string> = {
  contact: "Meet Mira in the pink marker. Press E for the job.",
  fight:
    "Recover the master tape: aim and defeat both armed blockers up the boulevard.",
  tape: "The yard is clear. Walk to the gold tape marker and press E.",
  escape:
    "Take the pink coupe with E. Lose the police — or stop at the cyan repaint garage ($100).",
  return: "Wanted clear. Return to Wave FM's green marker and press E.",
  complete: "Signal restored. Free roam, or R to replay the mission.",
  failed: "Job interrupted. Press R to retry; earned rewards stay safe.",
};
export class StreetGame {
  private player = { ...HOME, y: 0, yaw: 0, vehicle: null as string | null };
  private cars: Vehicle[] = [];
  private enemies: Enemy[] = [];
  private cameraYaw = 0;
  private orbitTime = 0;
  private aiming = false;
  private health = 100;
  private stamina = 100;
  private velocityY = 0;
  private magazine = 12;
  private reserve = 36;
  private reload = 0;
  private shotCooldown = 0;
  private weapon: "fists" | "pistol" = "pistol";
  private wanted = 0;
  private unseen = 0;
  private bust = 0;
  private garageTime = 0;
  private money = 200;
  private completed = false;
  private phase: Phase = "contact";
  private started = false;
  private paused = false;
  private elapsed = 0;
  private message =
    "Mira has a job. The station's master tape is being held up the boulevard.";
  private traces: StreetView["traces"] = [];

  constructor(saved: string | null = null) {
    try {
      const value = JSON.parse(saved || "null");
      if (
        value?.version === 1 &&
        typeof value.completed === "boolean" &&
        Number.isInteger(value.money) &&
        value.money >= 0 &&
        value.money <= MAX_CASH
      ) {
        this.completed = value.completed;
        this.money = value.money;
        if (this.completed) this.phase = "complete";
      }
    } catch {
      /* Invalid optional progress starts a fresh slice. */
    }
    this.resetDistrict();
  }
  private resetDistrict() {
    this.player = { ...HOME, y: 0, yaw: 0, vehicle: null };
    this.cars = [
      {
        id: "wave-coupe",
        x: 5,
        z: 39,
        yaw: Math.PI,
        speed: 0,
        health: 100,
        kind: "coupe",
        color: "#ff82b3",
        node: 7,
        goal: 7,
      },
      {
        id: "taxi",
        x: 44,
        z: -38,
        yaw: 0,
        speed: 5,
        health: 100,
        kind: "traffic",
        color: "#f9d16e",
        node: 2,
        goal: 11,
      },
      {
        id: "sedan",
        x: -44,
        z: 70,
        yaw: Math.PI,
        speed: 5,
        health: 100,
        kind: "traffic",
        color: "#82bfc7",
        node: 9,
        goal: 0,
      },
      {
        id: "patrol-1",
        x: 0,
        z: 90,
        yaw: Math.PI,
        speed: 0,
        health: 100,
        kind: "police",
        color: "#d5e0e9",
        node: 10,
        goal: 10,
      },
      {
        id: "patrol-2",
        x: -44,
        z: 88,
        yaw: Math.PI / 2,
        speed: 0,
        health: 100,
        kind: "police",
        color: "#d5e0e9",
        node: 9,
        goal: 9,
      },
    ];
    this.enemies = [
      { id: 1, x: -4, z: 41, health: 3, cooldown: 3 },
      { id: 2, x: 4, z: 47, health: 3, cooldown: 4 },
    ];
  }
  save(): string {
    return JSON.stringify({
      version: 1,
      completed: this.completed,
      money: this.money,
    });
  }
  look(delta: number) {
    if (!this.started || this.paused || !Number.isFinite(delta)) return;
    this.cameraYaw += Math.max(-Math.PI, Math.min(Math.PI, delta));
    this.orbitTime = 2;
  }
  command(
    command:
      | "start"
      | "pause"
      | "interact"
      | "jump"
      | "retry"
      | "reload"
      | "fists"
      | "pistol",
  ) {
    if (command === "start") {
      this.started = true;
      return;
    }
    if (command === "pause") {
      if (this.started) this.paused = !this.paused;
      this.aiming = false;
      return;
    }
    if (!this.started || this.paused) return;
    if (command === "retry") {
      this.resetDistrict();
      this.phase = "contact";
      this.health = 100;
      this.stamina = 100;
      this.velocityY = 0;
      this.wanted = 0;
      this.unseen = 0;
      this.bust = 0;
      this.garageTime = 0;
      this.magazine = 12;
      this.reserve = 36;
      this.reload = 0;
      this.shotCooldown = 0;
      this.cameraYaw = 0;
      this.orbitTime = 0;
      this.aiming = false;
      this.weapon = "pistol";
      this.traces = [];
      this.message = "Fresh attempt. Mira is waiting at the pink marker.";
      return;
    }
    if (this.phase === "failed") return;
    if (command === "jump" && !this.player.vehicle && this.player.y === 0)
      this.velocityY = 5.6;
    if (
      command === "reload" &&
      this.magazine < 12 &&
      this.reserve > 0 &&
      !this.reload
    )
      this.reload = 1.1;
    if (command === "fists" || command === "pistol") this.weapon = command;
    if (command === "interact") this.interact();
  }
  private interact() {
    const car = this.cars.find((v) => v.id === this.player.vehicle);
    if (
      this.phase === "contact" &&
      !car &&
      distance(this.player, CONTACT) < 3.3
    ) {
      this.phase = "fight";
      this.message =
        "Mira: They took our tape. Clear the yard, grab it, then bring it home. Watch your health.";
      return;
    }
    if (this.phase === "tape" && !car && distance(this.player, TAPE) < 3.3) {
      this.phase = "escape";
      this.wanted = Math.max(2, this.wanted);
      this.unseen = 0;
      this.message =
        "Tape recovered. Two stars! Take the coupe. Break sight around blocks or visit the cyan garage.";
      return;
    }
    if (
      this.phase === "return" &&
      this.wanted === 0 &&
      distance(this.player, HOME) < 5 &&
      (!car || Math.abs(car.speed) < 2)
    ) {
      this.phase = "complete";
      if (!this.completed) {
        const reward = Math.min(750, MAX_CASH - this.money);
        this.money += reward;
        this.completed = true;
        this.message = `JOB PASSED · $${reward}. The station is back on air. Free roam unlocked.`;
      } else
        this.message =
          "JOB PASSED · practice complete. Your original reward is already saved.";
      return;
    }
    if (car) {
      if (Math.abs(car.speed) > 2) {
        this.message = "Slow down before getting out.";
        return;
      }
      for (const offset of [Math.PI / 2, -Math.PI / 2, Math.PI, 0]) {
        const x = car.x + Math.sin(car.yaw + offset) * 2.8;
        const z = car.z + Math.cos(car.yaw + offset) * 2.8;
        if (
          !blocked(x, z, 0.5) &&
          !this.cars.some((v) => v !== car && distance(v, { x, z }) < 2)
        ) {
          this.player = { x, z, y: 0, yaw: car.yaw, vehicle: null };
          this.message = "On foot. Hold Shift to sprint, Space to jump.";
          return;
        }
      }
      this.message = "Door blocked. Move the car into open space.";
      return;
    }
    const nearby = this.cars
      .filter(
        (v) =>
          v.kind !== "police" &&
          Math.abs(v.speed) < 6 &&
          v.health > 0 &&
          distance(v, this.player) < 4.5,
      )
      .sort((a, b) => distance(a, this.player) - distance(b, this.player))[0];
    if (nearby && this.player.y < 0.2) {
      this.player.vehicle = nearby.id;
      this.player.x = nearby.x;
      this.player.z = nearby.z;
      this.player.yaw = nearby.yaw;
      this.cameraYaw = nearby.yaw;
      this.orbitTime = 0;
      this.aiming = false;
      if (nearby.kind === "traffic") this.wanted = Math.max(1, this.wanted);
      this.message =
        "W throttle · S brake/reverse · A/D steer · Space handbrake · E exit when slow.";
    } else
      this.message =
        "Get close to a slow car to enter. Follow the mission marker on the radar.";
  }
  update(delta: number, input: StreetInput) {
    if (!this.started || this.paused || this.phase === "failed") return;
    const duration = Math.max(
      0,
      Math.min(Number.isFinite(delta) ? delta : 0, 0.1),
    );
    const controls = {
      ...input,
      forward: axis(input.forward),
      side: axis(input.side),
    };
    for (let remaining = duration; remaining > 0.00001; ) {
      const dt = Math.min(remaining, 1 / 60);
      remaining -= dt;
      this.tick(dt, controls);
      if (this.isFailed()) break;
    }
  }
  private tick(dt: number, input: StreetInput) {
    this.elapsed += dt;
    this.orbitTime = Math.max(0, this.orbitTime - dt);
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);
    this.traces = this.traces
      .map((t) => ({ ...t, life: t.life - dt }))
      .filter((t) => t.life > 0);
    if (this.reload > 0) {
      this.reload = Math.max(0, this.reload - dt);
      if (!this.reload) {
        const rounds = Math.min(12 - this.magazine, this.reserve);
        this.magazine += rounds;
        this.reserve -= rounds;
      }
    }
    const car = this.cars.find((v) => v.id === this.player.vehicle);
    this.aiming = !!input.aim && !car;
    if (car) {
      this.drive(car, dt, input);
      Object.assign(this.player, { x: car.x, z: car.z, y: 0, yaw: car.yaw });
      if (!this.orbitTime && Math.abs(car.speed) > 2)
        this.cameraYaw +=
          angleDifference(car.yaw, this.cameraYaw) * Math.min(1, dt * 4);
    } else this.walk(dt, input);
    if (input.fire && !car) this.fire();
    this.traffic(dt);
    this.combat(dt);
    this.pursuit(dt);
    if (this.health <= 0 || (car && car.health <= 0))
      this.fail(car && car.health <= 0 ? "VEHICLE WRECKED" : "WASTED");
  }
  private walk(dt: number, input: StreetInput) {
    const forward = Math.max(-1, Math.min(1, input.forward || 0)),
      side = Math.max(-1, Math.min(1, input.side || 0));
    const length = Math.hypot(forward, side);
    const sprint =
      !!input.sprint && !this.aiming && this.stamina > 2 && length > 0;
    this.stamina = Math.max(
      0,
      Math.min(100, this.stamina + dt * (sprint ? -24 : 17)),
    );
    if (length) {
      const speed = this.aiming ? 2.3 : sprint ? 8 : 4.8;
      const dx =
        ((Math.sin(this.cameraYaw) * forward +
          Math.cos(this.cameraYaw) * side) /
          Math.max(1, length)) *
        speed *
        dt;
      const dz =
        ((Math.cos(this.cameraYaw) * forward -
          Math.sin(this.cameraYaw) * side) /
          Math.max(1, length)) *
        speed *
        dt;
      this.move(this.player, dx, dz, 0.45, this.player.y);
      this.player.yaw = this.aiming ? this.cameraYaw : Math.atan2(dx, dz);
    } else if (this.aiming) this.player.yaw = this.cameraYaw;
    if (this.player.y > 0 || this.velocityY > 0) {
      this.velocityY -= 14 * dt;
      this.player.y = Math.max(0, this.player.y + this.velocityY * dt);
      if (!this.player.y) this.velocityY = 0;
    }
  }
  private drive(car: Vehicle, dt: number, input: StreetInput) {
    const throttle = Math.max(-1, Math.min(1, input.forward || 0));
    car.speed += throttle * (throttle * car.speed < 0 ? 25 : 11) * dt;
    car.speed *= Math.exp(-(input.brake ? 5 : throttle ? 0.24 : 0.8) * dt);
    car.speed = Math.max(-10, Math.min(30, car.speed));
    car.yaw +=
      (input.side || 0) *
      Math.min(Math.abs(car.speed) / 7, 1) *
      Math.sign(car.speed) *
      dt *
      (input.brake ? 2.9 : 1.6);
    const speed = car.speed;
    if (
      !this.move(
        car,
        Math.sin(car.yaw) * speed * dt,
        Math.cos(car.yaw) * speed * dt,
        1.25,
      )
    ) {
      car.speed *= -0.22;
      car.health = Math.max(
        0,
        car.health - Math.max(0, Math.abs(speed) - 3) * 1.2,
      );
      if (Math.abs(speed) > 8)
        this.message = "Impact! Slow down around buildings and traffic.";
    }
    for (const other of this.cars) {
      if (other === car || distance(car, other) > 3) continue;
      if (Math.abs(car.speed) > 3) {
        car.health = Math.max(0, car.health - Math.abs(car.speed) * dt * 2);
        car.speed *= Math.exp(-3 * dt);
        if (other.kind === "traffic") this.wanted = Math.max(1, this.wanted);
      }
      const away = Math.atan2(car.x - other.x, car.z - other.z);
      this.move(car, Math.sin(away) * dt * 3, Math.cos(away) * dt * 3, 1.25);
    }
  }
  private move(
    point: Point,
    dx: number,
    dz: number,
    radius: number,
    y = 0,
  ): boolean {
    let clear = true;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.4));
    for (let i = 0; i < steps; i++) {
      if (!blocked(point.x + dx / steps, point.z, radius, y))
        point.x += dx / steps;
      else clear = false;
      if (!blocked(point.x, point.z + dz / steps, radius, y))
        point.z += dz / steps;
      else clear = false;
    }
    return clear;
  }
  private selectedTarget(): Enemy | undefined {
    return this.enemies
      .filter(
        (enemy) =>
          enemy.health > 0 &&
          distance(this.player, enemy) < (this.weapon === "fists" ? 2.5 : 48) &&
          Math.abs(
            angleDifference(
              Math.atan2(enemy.x - this.player.x, enemy.z - this.player.z),
              this.cameraYaw,
            ),
          ) < (this.aiming ? 0.65 : 0.08) &&
          sight(this.player, enemy),
      )
      .sort((a, b) => distance(a, this.player) - distance(b, this.player))[0];
  }
  private fire() {
    if (this.shotCooldown > 0 || this.reload > 0) return;
    const melee = this.weapon === "fists";
    if (!melee && this.magazine === 0) {
      this.message = this.reserve
        ? "Magazine empty — F reload."
        : "No rounds left. Use 1 for fists, or R to retry.";
      return;
    }
    this.shotCooldown = melee ? 0.55 : 0.27;
    if (!melee) {
      this.magazine--;
      this.wanted = Math.max(1, this.wanted);
    }
    const enemy = this.selectedTarget();
    if (enemy) {
      enemy.health--;
      this.message = enemy.health
        ? "Hit. Keep your aim steady."
        : "Blocker down.";
    }
    if (!melee) {
      const end = enemy || {
        x: this.player.x + Math.sin(this.cameraYaw) * 45,
        z: this.player.z + Math.cos(this.cameraYaw) * 45,
      };
      let to = { ...end };
      for (let i = 1; i < 90; i++) {
        const p = {
          x: this.player.x + ((end.x - this.player.x) * i) / 90,
          z: this.player.z + ((end.z - this.player.z) * i) / 90,
        };
        if (blocked(p.x, p.z, 0, 1.3)) {
          to = p;
          break;
        }
      }
      this.traces.push({
        from: { x: this.player.x, z: this.player.z },
        to,
        life: 0.1,
        hostile: false,
      });
    }
    if (
      this.phase === "fight" &&
      this.enemies.every((enemy) => enemy.health <= 0)
    ) {
      this.phase = "tape";
      this.message =
        "Yard clear. Collect the gold tape with E. Pink coupe parked on your right.";
    }
  }
  private combat(dt: number) {
    if (this.phase !== "fight") return;
    for (const enemy of this.enemies) {
      if (
        enemy.health <= 0 ||
        distance(enemy, this.player) > 28 ||
        !sight(enemy, this.player)
      )
        continue;
      enemy.cooldown -= dt;
      if (enemy.cooldown <= 0) {
        enemy.cooldown = 2.1;
        this.health = Math.max(0, this.health - (this.player.vehicle ? 3 : 9));
        this.traces.push({
          from: { x: enemy.x, z: enemy.z },
          to: { x: this.player.x, z: this.player.z },
          life: 0.15,
          hostile: true,
        });
        this.message =
          "Taking fire. Aim with right mouse / L; fire with left mouse / J. Use the low barriers.";
      }
    }
  }
  private traffic(dt: number) {
    for (const car of this.cars) {
      if (car.id === this.player.vehicle || car.kind === "coupe") continue;
      if (
        car.kind === "police" &&
        (!this.wanted || (car.id === "patrol-2" && this.wanted < 2))
      ) {
        car.speed *= Math.exp(-4 * dt);
        continue;
      }
      const chasing = car.kind === "police";
      let target: Point;
      if (chasing && distance(car, this.player) < 23 && sight(car, this.player))
        target = this.player;
      else {
        if (distance(car, nodes[car.node]) < 2) {
          if (chasing) car.goal = nearestNode(this.player);
          else if (car.node === car.goal)
            car.goal = car.goal < 3 ? car.goal + 9 : car.goal - 9;
          car.node = towardNode(car.node, car.goal);
        }
        target = nodes[car.node];
      }
      const heading = Math.atan2(target.x - car.x, target.z - car.z);
      car.yaw += angleDifference(heading, car.yaw) * Math.min(1, dt * 4);
      const gap = distance(car, this.player);
      const desired = chasing
        ? Math.min(12 + this.wanted * 1.5, Math.max(0, (gap - 3.2) * 1.6))
        : gap < 5
          ? 0
          : 7;
      car.speed += (desired - car.speed) * Math.min(1, dt * 2);
      this.move(
        car,
        Math.sin(car.yaw) * car.speed * dt,
        Math.cos(car.yaw) * car.speed * dt,
        1.2,
      );
    }
  }
  private pursuit(dt: number) {
    if (this.phase === "return" && this.wanted > 0) {
      this.phase = "escape";
      this.message =
        "Police attention renewed. Lose the police before bringing the tape home.";
    }
    if (!this.wanted) {
      this.bust = 0;
      this.garageTime = 0;
      if (this.phase === "escape" && this.player.vehicle) {
        this.phase = "return";
        this.message =
          "Wanted clear. Bring the tape home to the green Wave FM marker.";
      }
      return;
    }
    const police = this.cars.filter(
      (car) =>
        car.kind === "police" && (car.id === "patrol-1" || this.wanted >= 2),
    );
    const seen = police.some(
      (car) => distance(car, this.player) < 32 && sight(car, this.player),
    );
    this.unseen = seen ? 0 : this.unseen + dt;
    if (this.unseen > 7) {
      this.wanted--;
      this.unseen = 0;
      this.message = "A star faded. Keep out of police sight.";
    }
    const vehicle = this.cars.find((car) => car.id === this.player.vehicle);
    if (
      police.some((car) => distance(car, this.player) < 3.8) &&
      (!vehicle || Math.abs(vehicle.speed) < 2)
    )
      this.bust += dt;
    else this.bust = Math.max(0, this.bust - dt * 2);
    if (this.bust > 4) this.fail("BUSTED");
    if (
      vehicle &&
      distance(vehicle, GARAGE) < 5 &&
      Math.abs(vehicle.speed) < 2 &&
      this.money >= 100
    ) {
      this.garageTime += dt;
      if (this.garageTime >= 2.5) {
        this.money -= 100;
        this.wanted = 0;
        this.unseen = 0;
        this.bust = 0;
        vehicle.health = 100;
        vehicle.color = "#66d9d0";
        this.message =
          "Repaint complete · $100. Wanted clear and bodywork repaired. Return to Wave FM.";
      }
    } else this.garageTime = 0;
    if (this.phase === "escape" && !this.wanted && vehicle) {
      this.phase = "return";
      this.message =
        "Wanted clear. Bring the tape home to the green Wave FM marker.";
    }
    // The last star may fade before entry; the mission still requires taking a car.
    if (this.phase === "escape" && !this.wanted && !vehicle)
      this.message = "Wanted clear. Take a car to carry the tape home.";
  }
  private isFailed() {
    return this.phase === "failed";
  }
  private fail(reason: string) {
    this.phase = "failed";
    this.message = `${reason} · R retries the job. Saved rewards are preserved.`;
  }
  view(): StreetView {
    const target =
      this.phase === "contact"
        ? CONTACT
        : this.phase === "fight" || this.phase === "tape"
          ? TAPE
          : this.phase === "escape"
            ? this.player.vehicle
              ? GARAGE
              : this.cars.find((car) => car.id === "wave-coupe")!
            : HOME;
    return {
      player: { ...this.player },
      cars: this.cars.map((car) => ({ ...car })),
      enemies: this.enemies.map((enemy) => ({ ...enemy })),
      cameraYaw: this.cameraYaw,
      aiming: this.aiming,
      targetEnemy: this.aiming ? (this.selectedTarget()?.id ?? null) : null,
      health: this.health,
      stamina: this.stamina,
      magazine: this.magazine,
      reserve: this.reserve,
      reload: this.reload,
      weapon: this.weapon,
      wanted: this.wanted,
      unseen: this.unseen,
      bust: this.bust,
      garageTime: this.garageTime,
      money: this.money,
      completed: this.completed,
      phase: this.phase,
      started: this.started,
      paused: this.paused,
      elapsed: this.elapsed,
      message: this.message,
      objective: objectives[this.phase],
      target: { x: target.x, z: target.z },
      traces: this.traces.map((trace) => ({
        ...trace,
        from: { ...trace.from },
        to: { ...trace.to },
      })),
    };
  }
}
