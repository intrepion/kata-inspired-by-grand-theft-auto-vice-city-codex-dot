import type { StreetView } from "./game";
import {
  BOUNDS,
  CONTACT,
  GARAGE,
  HOME,
  TAPE,
  cameraFraction,
  blocks,
  covers,
  distance,
  roadsX,
  roadsZ,
  sight,
  type Point,
} from "./world";

type Vertex = Point & { y: number };
type Face = { vertices: Vertex[]; color: string };
type Camera = Vertex & { yaw: number; pitch: number };
const shade = (color: string, scale: number) => {
  const channels = color
    .match(/[a-f\d]{2}/gi)!
    .map((v) => Math.min(255, Math.round(parseInt(v, 16) * scale)));
  return `rgb(${channels.join(",")})`;
};
export class StreetRenderer {
  private context: CanvasRenderingContext2D;
  private width = 1;
  private height = 1;
  private camera: Camera = { x: 0, y: 4, z: -10, yaw: 0, pitch: 0.35 };
  private faces: Face[] = [];
  constructor(private canvas: HTMLCanvasElement) {
    this.context = canvas.getContext("2d")!;
  }
  render(view: StreetView) {
    const width = this.canvas.clientWidth,
      height = this.canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    if (
      this.canvas.width !== Math.round(width * ratio) ||
      this.canvas.height !== Math.round(height * ratio)
    ) {
      this.canvas.width = Math.round(width * ratio);
      this.canvas.height = Math.round(height * ratio);
    }
    this.width = width;
    this.height = height;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const back = view.player.vehicle ? 10 : view.aiming ? 5 : 7.5,
      rise = view.player.vehicle ? 4.2 : view.aiming ? 2.2 : 3.4;
    const focus = {
      x: view.player.x,
      z: view.player.z,
      y: view.player.y + 1.2,
    };
    const fraction = cameraFraction(focus, {
      x: focus.x - Math.sin(view.cameraYaw) * back,
      z: focus.z - Math.cos(view.cameraYaw) * back,
      y: focus.y + rise,
    });
    this.camera = {
      x: focus.x - Math.sin(view.cameraYaw) * back * fraction,
      z: focus.z - Math.cos(view.cameraYaw) * back * fraction,
      y: focus.y + rise * fraction,
      yaw: view.cameraYaw,
      pitch: Math.atan2(rise, back),
    };
    const sky = this.context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#293551");
    sky.addColorStop(0.45, "#ca8f9d");
    sky.addColorStop(1, "#eac3a4");
    this.context.fillStyle = sky;
    this.context.fillRect(0, 0, width, height);
    this.context.fillStyle = "#ffd8af";
    this.context.beginPath();
    this.context.arc(
      width * 0.74,
      height * 0.24,
      height * 0.055,
      0,
      Math.PI * 2,
    );
    this.context.fill();
    this.faces = [];
    this.plane(-150, -110, 150, 150, -0.12, "#5f8d9b");
    this.plane(
      BOUNDS.left,
      BOUNDS.bottom,
      BOUNDS.right,
      BOUNDS.top,
      -0.05,
      "#547677",
    );
    for (const x of roadsX)
      this.plane(x - 8, BOUNDS.bottom, x + 8, BOUNDS.top, 0, "#414856");
    for (const z of roadsZ)
      this.plane(BOUNDS.left, z - 8, BOUNDS.right, z + 8, 0.01, "#414856");
    for (const x of roadsX)
      for (let z = -72; z < 104; z += 8) {
        if (roadsZ.some((road) => Math.abs(z - road) < 8)) continue;
        this.plane(x - 0.12, z, x + 0.12, z + 3, 0.03, "#ddc899");
      }
    for (const z of roadsZ)
      for (let x = -72; x < 76; x += 8) {
        if (roadsX.some((road) => Math.abs(x - road) < 8)) continue;
        this.plane(x, z - 0.12, x + 3, z + 0.12, 0.03, "#ddc899");
      }
    this.drawFaces(false);
    this.faces = [];
    for (const block of blocks) {
      this.box(
        block.x,
        block.z,
        0.02,
        block.w + 3,
        0.16,
        block.d + 3,
        "#b5a6a0",
      );
      this.box(block.x, block.z, 0.18, block.w, block.h, block.d, block.color);
      this.box(
        block.x,
        block.z,
        block.h + 0.18,
        block.w + 0.4,
        0.3,
        block.d + 0.4,
        "#dbb9b6",
      );
      // Window strips sit just outside each facade and remain original geometry.
      for (let floor = 2.5; floor < block.h; floor += 2.8) {
        this.box(
          block.x,
          block.z - block.d / 2 - 0.04,
          floor,
          block.w - 3,
          0.75,
          0.08,
          "#5d748a",
        );
        this.box(
          block.x,
          block.z + block.d / 2 + 0.04,
          floor,
          block.w - 3,
          0.75,
          0.08,
          "#5d748a",
        );
      }
    }
    for (const cover of covers)
      this.box(cover.x, cover.z, 0, cover.w, cover.h, cover.d, cover.color);
    for (const x of [-9, 9, 53])
      for (const z of [-60, -15, 27, 70, 100]) {
        this.box(x, z, 0, 0.36, 6, 0.36, "#807566");
        for (const yaw of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
          const end = {
            x: x + Math.sin(yaw) * 2.8,
            z: z + Math.cos(yaw) * 2.8,
            y: 5.4,
          };
          this.faces.push({
            color: "#587d68",
            vertices: [
              { x, z, y: 6.4 },
              {
                x: end.x + Math.cos(yaw) * 0.65,
                z: end.z - Math.sin(yaw) * 0.65,
                y: end.y,
              },
              {
                x: end.x - Math.cos(yaw) * 0.65,
                z: end.z + Math.sin(yaw) * 0.65,
                y: end.y,
              },
            ],
          });
        }
      }
    this.marker(HOME, "#73dec1", view.elapsed);
    this.marker(GARAGE, "#67cfe8", view.elapsed);
    if (view.phase === "contact") this.marker(CONTACT, "#f786b9", view.elapsed);
    if (view.phase === "fight" || view.phase === "tape")
      this.marker(TAPE, "#ffd37f", view.elapsed);
    for (const car of view.cars) {
      this.box(car.x, car.z, 0.4, 1.9, 0.7, 3.9, car.color, car.yaw);
      this.box(car.x, car.z, 1.1, 1.55, 0.65, 1.7, "#5b7087", car.yaw);
      const right = { x: Math.cos(car.yaw), z: -Math.sin(car.yaw) };
      const front = { x: Math.sin(car.yaw), z: Math.cos(car.yaw) };
      for (const side of [-1, 1])
        for (const end of [-1, 1])
          this.box(
            car.x + right.x * side * 0.95 + front.x * end * 1.2,
            car.z + right.z * side * 0.95 + front.z * end * 1.2,
            0.2,
            0.25,
            0.55,
            0.65,
            "#252b39",
            car.yaw,
          );
      for (const side of [-1, 1])
        this.box(
          car.x + right.x * side * 0.62 + front.x * 1.97,
          car.z + right.z * side * 0.62 + front.z * 1.97,
          0.7,
          0.35,
          0.2,
          0.08,
          "#fff1c4",
          car.yaw,
        );
      if (car.kind === "police") {
        this.box(
          car.x + right.x * 0.4,
          car.z + right.z * 0.4,
          1.77,
          0.5,
          0.2,
          0.4,
          view.wanted && Math.floor(view.elapsed * 7) % 2
            ? "#ff707e"
            : "#9cb8d0",
          car.yaw,
        );
        this.box(
          car.x - right.x * 0.4,
          car.z - right.z * 0.4,
          1.77,
          0.5,
          0.2,
          0.4,
          view.wanted && Math.floor(view.elapsed * 7) % 2
            ? "#9cb8d0"
            : "#718dff",
          car.yaw,
        );
      }
    }
    if (!view.player.vehicle)
      this.person(
        view.player,
        view.player.yaw,
        "#f4a1bd",
        view.elapsed,
        view.aiming,
      );
    if (view.phase === "contact")
      this.person(CONTACT, Math.PI, "#73dec1", 0, false);
    for (const enemy of view.enemies) {
      if (enemy.health > 0)
        this.person(
          enemy,
          Math.atan2(view.player.x - enemy.x, view.player.z - enemy.z),
          "#e09160",
          0,
          true,
        );
      else this.box(enemy.x, enemy.z, 0.1, 0.8, 0.25, 1.4, "#6b6472");
    }
    this.drawFaces(true);
    for (const trace of view.traces) {
      const from = this.project({
        ...trace.from,
        y: 1.3 + view.player.y * Number(!trace.hostile),
      });
      const to = this.project({ ...trace.to, y: 1.3 });
      if (from && to) {
        this.context.strokeStyle = trace.hostile ? "#ff7588" : "#fff4be";
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.moveTo(from.x, from.y);
        this.context.lineTo(to.x, to.y);
        this.context.stroke();
      }
    }
    for (const enemy of view.enemies) {
      if (
        enemy.health <= 0 ||
        !sight(view.player, enemy) ||
        distance(view.player, enemy) > 48
      )
        continue;
      const point = this.project({ ...enemy, y: 2.4 });
      if (!point) continue;
      this.context.fillStyle =
        enemy.id === view.targetEnemy ? "#ffd37f" : "#e8b3a5";
      this.context.font = "bold 14px sans-serif";
      this.context.textAlign = "center";
      this.context.fillText(
        `${enemy.id === view.targetEnemy ? "◆ " : ""}${"▰".repeat(enemy.health)}`,
        point.x,
        point.y,
      );
    }
    for (const [point, label, color] of [
      [HOME, "WAVE FM", "#98f7dc"],
      [GARAGE, "REPAINT · $100", "#a6edff"],
      ...(view.phase === "contact" ? [[CONTACT, "MIRA · E", "#ffb3d0"]] : []),
    ] as [Point, string, string][]) {
      if (!sight(view.player, point, 4)) continue;
      const projected = this.project({ ...point, y: 4 });
      if (projected && distance(point, view.player) < 70) {
        this.context.font = "bold 12px sans-serif";
        this.context.textAlign = "center";
        this.context.fillStyle = color;
        this.context.fillText(label, projected.x, projected.y);
      }
    }
    const fade = this.context.createLinearGradient(0, height * 0.65, 0, height);
    fade.addColorStop(0, "#11152900");
    fade.addColorStop(1, "#11152999");
    this.context.fillStyle = fade;
    this.context.fillRect(0, 0, width, height);
  }
  private person(
    point: Point & { y?: number },
    yaw: number,
    color: string,
    time: number,
    aim: boolean,
  ) {
    const y = point.y || 0;
    const step = Math.sin(time * 9) * 0.12;
    const right = { x: Math.cos(yaw), z: -Math.sin(yaw) },
      front = { x: Math.sin(yaw), z: Math.cos(yaw) };
    for (const side of [-1, 1]) {
      this.box(
        point.x + right.x * side * 0.18 + front.x * step * side,
        point.z + right.z * side * 0.18 + front.z * step * side,
        y,
        0.25,
        0.77,
        0.32,
        "#364b70",
        yaw,
      );
      this.box(
        point.x + right.x * side * 0.43 + front.x * (aim ? 0.35 : 0),
        point.z + right.z * side * 0.43 + front.z * (aim ? 0.35 : 0),
        y + (aim ? 1.1 : 0.85),
        0.2,
        aim ? 0.22 : 0.55,
        aim ? 0.65 : 0.25,
        "#d7a38e",
        yaw,
      );
    }
    this.box(point.x, point.z, y + 0.74, 0.68, 0.75, 0.4, color, yaw);
    this.box(point.x, point.z, y + 1.49, 0.4, 0.43, 0.4, "#d7a38e", yaw);
    this.box(point.x, point.z, y + 1.85, 0.44, 0.14, 0.44, "#423d4c", yaw);
    if (aim)
      this.box(
        point.x + front.x * 0.7 + right.x * 0.37,
        point.z + front.z * 0.7 + right.z * 0.37,
        y + 1.29,
        0.13,
        0.15,
        0.45,
        "#263344",
        yaw,
      );
  }
  private marker(point: Point, color: string, time: number) {
    const radius = 2.3;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2,
        b = ((i + 0.7) / 20) * Math.PI * 2;
      this.faces.push({
        color,
        vertices: [
          {
            x: point.x + Math.sin(a) * radius,
            z: point.z + Math.cos(a) * radius,
            y: 0.08,
          },
          {
            x: point.x + Math.sin(b) * radius,
            z: point.z + Math.cos(b) * radius,
            y: 0.08,
          },
          {
            x: point.x + Math.sin(b) * (radius - 0.25),
            z: point.z + Math.cos(b) * (radius - 0.25),
            y: 0.08,
          },
          {
            x: point.x + Math.sin(a) * (radius - 0.25),
            z: point.z + Math.cos(a) * (radius - 0.25),
            y: 0.08,
          },
        ],
      });
    }
    this.box(
      point.x,
      point.z,
      2.9 + Math.sin(time * 3) * 0.2,
      0.35,
      0.35,
      0.35,
      color,
      time,
    );
  }
  private plane(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    y: number,
    color: string,
  ) {
    this.faces.push({
      color,
      vertices: [
        { x: x1, z: z1, y },
        { x: x2, z: z1, y },
        { x: x2, z: z2, y },
        { x: x1, z: z2, y },
      ],
    });
  }
  private box(
    x: number,
    z: number,
    y: number,
    w: number,
    h: number,
    d: number,
    color: string,
    yaw = 0,
  ) {
    const vertices = [-1, 1].flatMap((up) =>
      [-1, 1].flatMap((front) =>
        [-1, 1].map((side) => ({
          x:
            x +
            (Math.cos(yaw) * side * w) / 2 +
            (Math.sin(yaw) * front * d) / 2,
          z:
            z -
            (Math.sin(yaw) * side * w) / 2 +
            (Math.cos(yaw) * front * d) / 2,
          y: y + ((up + 1) / 2) * h,
        })),
      ),
    );
    for (const [indices, light] of [
      [[0, 1, 5, 4], 0.8],
      [[2, 3, 7, 6], 0.9],
      [[0, 2, 6, 4], 0.7],
      [[1, 3, 7, 5], 1],
      [[4, 5, 7, 6], 1.12],
    ] as [number[], number][]) {
      this.faces.push({
        vertices: indices.map((i) => vertices[i]),
        color: shade(color, light),
      });
    }
  }
  private transform(vertex: Vertex): Vertex {
    const dx = vertex.x - this.camera.x,
      dy = vertex.y - this.camera.y,
      dz = vertex.z - this.camera.z;
    const forward =
      dx * Math.sin(this.camera.yaw) + dz * Math.cos(this.camera.yaw);
    return {
      x: dx * Math.cos(this.camera.yaw) - dz * Math.sin(this.camera.yaw),
      y:
        dy * Math.cos(this.camera.pitch) +
        forward * Math.sin(this.camera.pitch),
      z:
        forward * Math.cos(this.camera.pitch) -
        dy * Math.sin(this.camera.pitch),
    };
  }
  private project(vertex: Vertex): { x: number; y: number } | null {
    const point = this.transform(vertex);
    return point.z < 0.15
      ? null
      : {
          x: this.width / 2 + (point.x / point.z) * this.height * 0.78,
          y: this.height / 2 - (point.y / point.z) * this.height * 0.78,
        };
  }
  private drawFaces(sort: boolean) {
    const faces = this.faces.map((face) => ({
      ...face,
      points: face.vertices.map((vertex) => this.transform(vertex)),
    }));
    if (sort)
      faces.sort(
        (a, b) =>
          b.points.reduce((sum, p) => sum + p.z, 0) / b.points.length -
          a.points.reduce((sum, p) => sum + p.z, 0) / a.points.length,
      );
    for (const face of faces) {
      const clipped: Vertex[] = [];
      for (let i = 0; i < face.points.length; i++) {
        const a = face.points[i],
          b = face.points[(i + 1) % face.points.length];
        if (a.z >= 0.15) clipped.push(a);
        if (a.z >= 0.15 !== b.z >= 0.15) {
          const t = (0.15 - a.z) / (b.z - a.z);
          clipped.push({
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
            z: 0.15,
          });
        }
      }
      if (clipped.length < 3) continue;
      this.context.beginPath();
      clipped.forEach((point, index) => {
        const x = this.width / 2 + (point.x / point.z) * this.height * 0.78,
          y = this.height / 2 - (point.y / point.z) * this.height * 0.78;
        if (!index) this.context.moveTo(x, y);
        else this.context.lineTo(x, y);
      });
      this.context.closePath();
      this.context.fillStyle = face.color;
      this.context.fill();
    }
  }
  minimap(canvas: HTMLCanvasElement, view: StreetView) {
    const ctx = canvas.getContext("2d")!,
      width = canvas.width,
      height = canvas.height;
    const scale = Math.min(width / 170, height / 200);
    const project = (point: Point) => ({
      x: width / 2 + point.x * scale,
      y: height - 10 - (point.z + 76) * scale,
    });
    ctx.fillStyle = "#243b4b";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#677581";
    ctx.lineWidth = 10 * scale;
    for (const x of roadsX) {
      const a = project({ x, z: -76 }),
        b = project({ x, z: 106 });
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (const z of roadsZ) {
      const a = project({ x: -76, z }),
        b = project({ x: 76, z });
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    const dot = (point: Point, color: string, radius: number) => {
      const p = project(point);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    };
    dot(HOME, "#78eac5", 4);
    dot(GARAGE, "#70d7f4", 4);
    dot(view.target, "#ffd782", 5);
    for (const car of view.cars)
      dot(
        car,
        car.kind === "police"
          ? view.wanted
            ? "#fb90aa"
            : "#8996a6"
          : car.color,
        2.5,
      );
    for (const enemy of view.enemies)
      if (enemy.health > 0) dot(enemy, "#ee9e73", 2.5);
    const p = project(view.player);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(view.player.yaw);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(-4, 4);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
