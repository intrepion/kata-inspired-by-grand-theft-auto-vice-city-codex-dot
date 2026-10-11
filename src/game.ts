import {
  SAFE,
  WORLD,
  distance,
  solid,
  nodes,
  nearestNode,
  nextNode,
  visible,
  type Point,
} from "./city";
export type Input = Partial<
  Record<"up" | "down" | "left" | "right" | "brake", boolean>
>;
export type Car = Point & {
  id: string;
  angle: number;
  speed: number;
  health: number;
  color: string;
  kind: "parked" | "traffic" | "police";
  node: number;
  goal: number;
};
export type Stage = {
  label: string;
  target?: Point;
  car?: string;
  heat?: number;
  escape?: boolean;
};
export type Job = {
  title: string;
  contact: string;
  dialogue: string;
  reward: number;
  time: number;
  stages: Stage[];
};
export const JOBS: Job[] = [
  {
    title: "01 / Midnight frequency",
    contact: "Mira · station manager",
    dialogue:
      "The station is quiet. Take these transmitter parts to Juno at the promenade before our midnight test. The loaner is yours.",
    reward: 450,
    time: 100,
    stages: [
      {
        label: "Deliver transmitter parts to the promenade",
        target: { x: 1460, y: 820 },
      },
    ],
  },
  {
    title: "02 / Borrowed sunshine",
    contact: "Juno · sound engineer",
    dialogue:
      "Our festival roadster was left at the north marina. Bring the yellow Sunbird home. Please bring it back in one piece.",
    reward: 700,
    time: 150,
    stages: [
      {
        label: "Find and enter the yellow Sunbird",
        target: { x: 1140, y: 180 },
        car: "sunbird",
      },
      {
        label: "Return the Sunbird to the safehouse",
        target: SAFE,
        car: "sunbird",
      },
    ],
  },
  {
    title: "03 / Static on the line",
    contact: "Sol · night producer",
    dialogue:
      "Someone jammed our broadcast. Test the relay at the old market, then lose the city patrol and come home with a clean signal.",
    reward: 900,
    time: 150,
    stages: [
      {
        label: "Test the relay at Bay Market",
        target: { x: 820, y: 820 },
        heat: 2,
      },
      { label: "Break line of sight and cool your heat", escape: true },
      { label: "Return to the safehouse", target: SAFE },
    ],
  },
  {
    title: "04 / Before the dawn",
    contact: "Mira · station manager",
    dialogue:
      "One last run. Pick up the master tape at the marina, deliver it to the beach stage, then lose the patrol. Tonight the whole city hears us.",
    reward: 1600,
    time: 180,
    stages: [
      {
        label: "Collect the master tape at the marina",
        target: { x: 1460, y: 180 },
      },
      {
        label: "Deliver the tape to the beach stage",
        target: { x: 1460, y: 1140 },
        heat: 3,
      },
      { label: "Escape patrol attention", escape: true },
      { label: "Come home for the first broadcast", target: SAFE },
    ],
  },
];
export type Progress = { version: 1; completed: number; money: number };
export type Snapshot = {
  player: Point & { angle: number; vehicle: string | null };
  cars: Car[];
  completed: number;
  money: number;
  active: boolean;
  stage: number;
  remaining: number;
  failed: boolean;
  heat: number;
  unseen: number;
  message: string;
  paused: boolean;
  elapsed: number;
  target: Point | null;
  objective: string;
};
export class Game {
  private player = {
    ...SAFE,
    angle: -Math.PI / 2,
    vehicle: null as string | null,
  };
  private cars: Car[] = [];
  private completed = 0;
  private money = 0;
  private active = false;
  private stage = 0;
  private remaining = 0;
  private failed = false;
  private heat = 0;
  private unseen = 0;
  private message =
    "Welcome to Neon Harbor. Meet Mira at the glowing apartment marker.";
  private paused = false;
  private elapsed = 0;
  private spawnClock = 0;
  private impactClock = 0;
  constructor(save?: string | null) {
    if (save) this.load(save);
    this.resetWorld();
    if (this.completed === JOBS.length)
      this.message = "The broadcast is live. Welcome back to free roam.";
    else if (this.completed > 0)
      this.message =
        "Welcome back. Your completed jobs and rewards are saved. Meet your contact at home.";
  }
  private resetWorld() {
    this.player = { ...SAFE, angle: -Math.PI / 2, vehicle: null };
    this.cars = [
      this.car("loaner", 180, 1080, "#ff799e"),
      this.car("sunbird", 1140, 180, "#ffd166"),
      this.car("comet", 500, 500, "#69eadb"),
      this.car("wagon", 1460, 500, "#b997ff"),
    ];
    for (let i = 0; i < 9; i++) {
      const n = (i * 3 + 2) % nodes.length,
        c = this.car(
          "traffic" + i,
          nodes[n].x + 22,
          nodes[n].y + 22,
          ["#809eb9", "#dfaa6e", "#b6a2cc"][i % 3],
        );
      c.kind = "traffic";
      c.node = n;
      c.goal = (n + 5) % nodes.length;
      this.cars.push(c);
    }
    this.heat = 0;
    this.unseen = 0;
    this.spawnClock = 0;
  }
  private car(id: string, x: number, y: number, color: string): Car {
    return {
      id,
      x,
      y,
      color,
      angle: -Math.PI / 2,
      speed: 0,
      health: 100,
      kind: "parked",
      node: nearestNode({ x, y }),
      goal: 0,
    };
  }
  view(): Snapshot {
    const job = JOBS[this.completed],
      s = this.active ? job?.stages[this.stage] : undefined;
    return {
      player: { ...this.player },
      cars: this.cars.map((c) => ({ ...c })),
      completed: this.completed,
      money: this.money,
      active: this.active,
      stage: this.stage,
      remaining: this.remaining,
      failed: this.failed,
      heat: this.heat,
      unseen: this.unseen,
      message: this.message,
      paused: this.paused,
      elapsed: this.elapsed,
      target:
        s?.target ??
        (!this.active && this.completed < JOBS.length ? SAFE : null),
      objective: this.failed
        ? "Job interrupted — press Retry to try again"
        : (s?.label ??
          (this.completed === JOBS.length
            ? "The airwaves are yours. Explore Neon Harbor."
            : "Meet your contact at the safehouse")),
    };
  }
  save(): string {
    return JSON.stringify({
      version: 1,
      completed: this.completed,
      money: this.money,
    } satisfies Progress);
  }
  load(raw: string): boolean {
    try {
      const p = JSON.parse(raw) as Progress;
      const expected = JOBS.reduce(
        (totals, job) => [...totals, totals[totals.length - 1] + job.reward],
        [0],
      );
      if (
        p.version !== 1 ||
        !Number.isInteger(p.completed) ||
        p.completed < 0 ||
        p.completed > JOBS.length ||
        p.money !== expected[p.completed]
      )
        return false;
      this.completed = p.completed;
      this.money = p.money;
      this.active = false;
      this.failed = false;
      this.stage = 0;
      this.remaining = 0;
      this.resetWorld();
      return true;
    } catch {
      return false;
    }
  }
  command(
    action: "interact" | "recover" | "retry" | "pause" | "new-campaign",
  ): void {
    if (action === "new-campaign") {
      this.completed = 0;
      this.money = 0;
      this.active = false;
      this.failed = false;
      this.stage = 0;
      this.remaining = 0;
      this.paused = false;
      this.resetWorld();
      this.message = "Welcome to Neon Harbor. Meet Mira at home to begin.";
      return;
    }
    if (action === "pause") {
      this.paused = !this.paused;
      return;
    }
    if (this.paused) return;
    if (action === "recover") {
      this.resetWorld();
      if (this.active) {
        this.active = false;
        this.failed = true;
      }
      this.message = this.failed
        ? "Recovered at the safehouse. Finished jobs and rewards are safe. Retry when ready."
        : "Recovered and repaired at home. Your rewards are safe.";
      return;
    }
    if (action === "retry") {
      if (this.failed) {
        this.resetWorld();
        this.start();
      }
      return;
    }
    if (this.failed) {
      this.message = "Use Retry to restart this job.";
      return;
    }
    if (
      !this.active &&
      distance(this.player, SAFE) < 65 &&
      this.completed < JOBS.length
    ) {
      this.start();
      return;
    }
    if (this.active && this.reachStage()) return;
    if (this.player.vehicle) {
      const c = this.cars.find((v) => v.id === this.player.vehicle)!;
      if (Math.abs(c.speed) > 35) {
        this.message = "Brake to a crawl before exiting.";
        return;
      }
      for (let i = 0; i < 16; i++) {
        const a = c.angle + Math.PI / 2 + (i * Math.PI) / 8,
          x = c.x + Math.cos(a) * 38,
          y = c.y + Math.sin(a) * 38;
        if (
          !solid(x, y, 9) &&
          !this.cars.some((o) => o !== c && distance({ x, y }, o) < 27)
        ) {
          this.player = { x, y, angle: c.angle, vehicle: null };
          c.speed = 0;
          this.message = "On foot. E enters a nearby parked car.";
          return;
        }
      }
      this.message = "No safe exit here. Move the car into an open street.";
      return;
    }
    const near = this.cars
      .filter(
        (c) =>
          c.kind === "parked" && c.health > 0 && distance(c, this.player) < 65,
      )
      .sort((a, b) => distance(a, this.player) - distance(b, this.player))[0];
    if (near) {
      this.player.vehicle = near.id;
      this.player.x = near.x;
      this.player.y = near.y;
      this.message =
        near.id === "sunbird"
          ? "Sunbird recovered. Take it back to Mira."
          : "Seatbelt on. Arrows/WASD drive; Space brakes; E exits.";
      if (this.active) this.reachStage();
    } else this.message = "Move closer to a parked car or a glowing objective.";
  }
  private start() {
    this.active = true;
    this.failed = false;
    this.stage = 0;
    this.remaining = JOBS[this.completed].time;
    this.message = JOBS[this.completed].dialogue;
  }
  private reachStage(): boolean {
    const s = JOBS[this.completed]?.stages[this.stage];
    if (!s || !this.active) return false;
    if (s.escape) return false;
    if (!s.target || distance(this.player, s.target) > 65) return false;
    if (s.car && this.player.vehicle !== s.car) return false;
    if (
      this.player.vehicle &&
      Math.abs(this.cars.find((c) => c.id === this.player.vehicle)!.speed) > 45
    ) {
      this.message = "Slow down to hand over the cargo.";
      return false;
    }
    if (s.heat) {
      this.heat = s.heat;
      this.unseen = 0;
      this.message =
        "Patrol attention rising. Take a turn, break sight, then stay out of view.";
    }
    this.advance();
    return true;
  }
  private advance() {
    this.stage++;
    const job = JOBS[this.completed];
    if (this.stage >= job.stages.length) {
      this.money += job.reward;
      this.completed++;
      this.active = false;
      this.stage = 0;
      this.heat = 0;
      this.cars = this.cars.filter((c) => c.kind !== "police");
      this.message =
        this.completed === JOBS.length
          ? "NEON HARBOR IS ON AIR. Campaign complete — free roam unlocked."
          : `Job complete. +$${job.reward}. Mira has your next run at the safehouse.`;
    } else if (!job.stages[this.stage].escape)
      this.message = job.stages[this.stage].label;
  }
  update(dt: number, input: Input = {}): void {
    if (this.paused || !Number.isFinite(dt) || dt <= 0) return;
    let left = Math.min(dt, 0.25);
    while (left > 0) {
      const step = Math.min(left, 1 / 120);
      this.tick(step, input);
      left -= step;
    }
  }
  private move(
    p: Point,
    dx: number,
    dy: number,
    r: number,
    blockers: Car[] = [],
  ): boolean {
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
    let hit = false;
    for (let i = 0; i < steps; i++) {
      if (
        !solid(p.x + dx / steps, p.y, r) &&
        !blockers.some((c) => distance(c, { x: p.x + dx / steps, y: p.y }) < 36)
      )
        p.x += dx / steps;
      else hit = true;
      if (
        !solid(p.x, p.y + dy / steps, r) &&
        !blockers.some((c) => distance(c, { x: p.x, y: p.y + dy / steps }) < 36)
      )
        p.y += dy / steps;
      else hit = true;
    }
    return hit;
  }
  private tick(dt: number, input: Input) {
    this.elapsed += dt;
    this.impactClock = Math.max(0, this.impactClock - dt);
    const current = this.cars.find((c) => c.id === this.player.vehicle);
    if (current) {
      if (current.health <= 0) {
        current.speed = 0;
        this.message = "Vehicle disabled. Press R or Recover to return home.";
      } else {
        const throttle = Number(!!input.up) - Number(!!input.down),
          steer = Number(!!input.right) - Number(!!input.left);
        current.speed += throttle * 210 * dt;
        current.speed *= Math.exp(
          -(input.brake ? 6 : throttle ? 0.25 : 1.2) * dt,
        );
        current.speed = Math.max(-105, Math.min(310, current.speed));
        current.angle +=
          steer *
          2.4 *
          dt *
          Math.min(1, Math.abs(current.speed) / 65) *
          Math.sign(current.speed);
        if (
          this.move(
            current,
            Math.cos(current.angle) * current.speed * dt,
            Math.sin(current.angle) * current.speed * dt,
            18,
            this.cars.filter((c) => c !== current && c.kind === "parked"),
          )
        ) {
          if (this.impactClock === 0 && Math.abs(current.speed) > 45) {
            current.health = Math.max(
              0,
              current.health - Math.abs(current.speed) * 0.07,
            );
            this.impactClock = 0.5;
            this.message = "Bodywork scratched. Safehouse repairs are free.";
          }
          current.speed *= 0.85;
        }
      }
      this.player.x = current.x;
      this.player.y = current.y;
      this.player.angle = current.angle;
    } else {
      let dx = Number(!!input.right) - Number(!!input.left),
        dy = Number(!!input.down) - Number(!!input.up);
      const n = Math.hypot(dx, dy);
      if (n) {
        dx /= n;
        dy /= n;
        this.player.angle = Math.atan2(dy, dx);
        this.move(this.player, dx * 130 * dt, dy * 130 * dt, 9);
      }
    }
    for (const c of this.cars) {
      if (c.kind === "parked") continue;
      this.driveAI(c, dt);
      if (
        current &&
        distance(c, current) < 36 &&
        this.impactClock === 0 &&
        Math.abs(current.speed) > 30
      ) {
        current.health = Math.max(0, current.health - 8);
        current.speed *= -0.3;
        this.heat = Math.min(3, this.heat + 0.5);
        this.unseen = 0;
        this.impactClock = 1;
        this.message = "Traffic collision. Patrol attention increased.";
      }
    }
    if (distance(this.player, SAFE) < 52) {
      if (current) current.health = 100;
      this.heat = Math.max(0, this.heat - dt * 0.8);
    }
    if (this.heat > 0) {
      this.spawnClock += dt;
      if (
        this.spawnClock > 4 &&
        this.cars.filter((c) => c.kind === "police").length <
          Math.ceil(this.heat)
      ) {
        this.spawnClock = 0;
        this.spawnPolice();
      }
      const seen = this.cars.some(
        (c) =>
          c.kind === "police" &&
          distance(c, this.player) < 240 &&
          visible(c, this.player),
      );
      if (seen && distance(this.player, SAFE) > 52) this.unseen = 0;
      else {
        this.unseen += dt;
        this.heat = Math.max(
          0,
          this.heat - dt * (this.unseen > 5 ? 0.16 : 0.03),
        );
      }
    } else {
      this.cars = this.cars.filter((c) => c.kind !== "police");
      this.unseen = 0;
    }
    if (this.active) {
      this.remaining -= dt;
      if (this.remaining <= 0) {
        this.remaining = 0;
        this.active = false;
        this.failed = true;
        this.message =
          "The window closed. Retry the job — your earlier rewards are safe.";
      } else if (
        JOBS[this.completed].stages[this.stage].escape &&
        this.heat === 0
      )
        this.advance();
    }
  }
  private spawnPolice() {
    const options = nodes.filter(
      (n) => distance(n, this.player) > 330 && distance(n, this.player) < 650,
    );
    if (!options.length) return;
    const p = options[Math.floor(this.elapsed) % options.length],
      c = this.car("patrol" + this.elapsed.toFixed(2), p.x, p.y, "#edf4ff");
    c.kind = "police";
    c.node = nearestNode(p);
    c.goal = nearestNode(this.player);
    this.cars.push(c);
  }
  private driveAI(c: Car, dt: number) {
    const target = nodes[c.node],
      lane = c.kind === "traffic" ? 22 : 0,
      dx = target.x + lane - c.x,
      dy = target.y + lane - c.y,
      d = Math.hypot(dx, dy);
    if (d < 3) {
      c.x = target.x + lane;
      c.y = target.y + lane;
      if (c.kind === "police") c.goal = nearestNode(this.player);
      else if (c.node === c.goal) c.goal = (c.goal + 7) % nodes.length;
      c.node = nextNode(c.node, c.goal);
      return;
    }
    c.angle = Math.atan2(dy, dx);
    c.speed = c.kind === "police" ? 165 : 72;
    // Approaching AI yields to the occupied vehicle; patrols trail rather than ram.
    if (
      this.player.vehicle &&
      distance(c, this.player) < 100 &&
      dx * (this.player.x - c.x) + dy * (this.player.y - c.y) > 0
    )
      c.speed = Math.min(
        c.speed,
        Math.max(0, (distance(c, this.player) - 55) * 3),
      );
    this.move(
      c,
      (dx / d) * Math.min(d, c.speed * dt),
      (dy / d) * Math.min(d, c.speed * dt),
      17,
    );
  }
}
