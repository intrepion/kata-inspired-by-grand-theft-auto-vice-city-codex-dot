import {
  buildings,
  ROAD_X,
  ROAD_Y,
  SAFE,
  WORLD,
  distance,
  nodes,
  nearestNode,
  nextNode,
  type Point,
} from "./city";
import type { Snapshot, Car } from "./game";
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private camera = { x: 180, y: 1140 };
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }
  render(s: Snapshot, reduced: boolean) {
    const c = this.ctx,
      rect = this.canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    if (
      this.canvas.width !== Math.round(rect.width * dpr) ||
      this.canvas.height !== Math.round(rect.height * dpr)
    ) {
      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width,
      h = rect.height,
      zoom = w < 650 ? 0.7 : 1;
    this.camera.x += (s.player.x - this.camera.x) * (reduced ? 1 : 0.13);
    this.camera.y += (s.player.y - this.camera.y) * (reduced ? 1 : 0.13);
    const cx = Math.max(
        w / zoom / 2 - 80,
        Math.min(WORLD.w - w / zoom / 2 + 80, this.camera.x),
      ),
      cy = Math.max(
        h / zoom / 2 - 60,
        Math.min(WORLD.h - h / zoom / 2 + 60, this.camera.y),
      );
    c.fillStyle = "#153440";
    c.fillRect(0, 0, w, h);
    c.save();
    c.translate(w / 2, h / 2);
    c.scale(zoom, zoom);
    c.translate(-cx, -cy);
    this.city(s.elapsed, reduced);
    if (s.target) {
      this.route(s.player, s.target);
      this.marker(s.target, "", s.elapsed, reduced, "#ffd166");
    }
    this.marker(SAFE, "WAVE FM / HOME", s.elapsed, true, "#71f5d3");
    for (const car of s.cars) this.car(car, s.elapsed);
    if (!s.player.vehicle) {
      c.save();
      c.translate(s.player.x, s.player.y);
      c.fillStyle = "#0008";
      c.beginPath();
      c.ellipse(3, 7, 10, 5, 0, 0, 7);
      c.fill();
      c.rotate(s.player.angle);
      c.fillStyle = "#fbe2bb";
      c.fillRect(-4, -5, 8, 10);
      c.fillStyle = "#ff6496";
      c.fillRect(-7, -6, 9, 12);
      c.fillStyle = "#302847";
      c.fillRect(-9, -5, 3, 4);
      c.fillRect(-9, 1, 3, 4);
      c.restore();
    }
    c.restore();
    const vignette = c.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.2,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.65,
    );
    vignette.addColorStop(0, "#07102000");
    vignette.addColorStop(1, "#07102070");
    c.fillStyle = vignette;
    c.fillRect(0, 0, w, h);
  }
  private city(time: number, reduced: boolean) {
    const c = this.ctx;
    c.fillStyle = "#254851";
    c.fillRect(55, 55, 1555, 1255);
    c.fillStyle = "#e4b78c";
    c.fillRect(1560, 50, 100, 1290);
    c.fillStyle = "#154454";
    c.fillRect(1660, 0, 140, 1400);
    for (let y = 40; y < 1400; y += 42) {
      c.strokeStyle = "#5cb2b333";
      c.lineWidth = 2;
      c.beginPath();
      for (let x = 1660; x < 1800; x += 8) {
        const yy = y + Math.sin(x * 0.04 + (reduced ? 0 : time * 0.5)) * 4;
        if (x === 1660) c.moveTo(x, yy);
        else c.lineTo(x, yy);
      }
      c.stroke();
    }
    c.fillStyle = "#2d6570";
    c.fillRect(1585, 105, 180, 22);
    c.fillRect(1590, 210, 175, 20);
    c.fillStyle = "#ece1bb";
    for (let i = 0; i < 4; i++) {
      c.fillRect(1690, 130 + i * 18, 45, 10);
    }
    for (const x of ROAD_X) {
      c.fillStyle = "#4e6175";
      c.fillRect(x - 64, 65, 128, 1230);
      c.fillStyle = "#202b42";
      c.fillRect(x - 45, 65, 90, 1230);
    }
    for (const y of ROAD_Y) {
      c.fillStyle = "#4e6175";
      c.fillRect(65, y - 64, 1535, 128);
      c.fillStyle = "#202b42";
      c.fillRect(65, y - 45, 1535, 90);
    }
    c.setLineDash([18, 18]);
    c.strokeStyle = "#d9b67988";
    c.lineWidth = 2;
    for (const x of ROAD_X) {
      c.beginPath();
      c.moveTo(x, 75);
      c.lineTo(x, 1290);
      c.stroke();
    }
    for (const y of ROAD_Y) {
      c.beginPath();
      c.moveTo(75, y);
      c.lineTo(1600, y);
      c.stroke();
    }
    c.setLineDash([]);
    for (const x of ROAD_X)
      for (const y of ROAD_Y) {
        c.fillStyle = "#202b42";
        c.fillRect(x - 44, y - 44, 88, 88);
        c.fillStyle = "#9cb5bb70";
        for (let i = 0; i < 6; i++) {
          c.fillRect(x - 38 + i * 13, y - 53, 7, 12);
          c.fillRect(x - 38 + i * 13, y + 41, 7, 12);
        }
        c.fillStyle = "#72f5c9";
        c.fillRect(x + 51, y - 48, 3, 5);
      }
    for (const b of buildings) {
      c.fillStyle = "#0a132755";
      c.fillRect(b.x + 12, b.y + 16, b.w + 8, b.h + 12);
      c.fillStyle = "#2f4054";
      c.fillRect(b.x, b.y + 10, b.w, b.h);
      c.fillStyle = b.color;
      c.fillRect(b.x, b.y - b.height, b.w, b.h);
      c.fillStyle = "#27364f";
      c.fillRect(b.x + 8, b.y - b.height + 8, b.w - 16, b.h - 16);
      c.fillStyle = b.color;
      c.fillRect(b.x + 16, b.y - b.height + 16, b.w - 32, b.h - 32);
      c.fillStyle = "#253a4d";
      c.fillRect(b.x + 40, b.y - b.height + 45, 55, 40);
      c.fillStyle = "#16283b";
      c.fillRect(b.x + 45, b.y - b.height + 50, 45, 30);
      c.fillStyle = "#607687";
      c.fillRect(b.x + 120, b.y - b.height + 45, 30, 30);
      for (let x = b.x + 10; x < b.x + b.w - 10; x += 22) {
        c.fillStyle = Math.floor(x + b.y) % 3 === 0 ? "#ffe0a1" : "#77c6cc";
        c.fillRect(x, b.y + b.h - b.height + 4, 12, 8);
      }
      c.shadowColor = "#ff7aa9";
      c.shadowBlur = 8;
      c.fillStyle = "#ffe2ee";
      c.font = "bold 11px sans-serif";
      c.textAlign = "center";
      c.fillText(b.name, b.x + b.w / 2, b.y + b.h - b.height - 12);
      c.shadowBlur = 0;
    }
    // Gardens, lamps, palms and street furniture are entirely procedural.
    for (let i = 0; i < 28; i++) {
      const x = i % 2 ? 1540 : 110,
        y = 110 + i * 42;
      this.palm(x, y, i);
    }
    for (const x of ROAD_X)
      for (let y = 270; y < 1100; y += 160) {
        this.palm(x - 57, y, Math.floor(y));
        c.fillStyle = "#27384d";
        c.fillRect(x + 52, y - 12, 3, 21);
        c.shadowBlur = 18;
        c.shadowColor = "#ffb4c4";
        c.fillStyle = "#ffe6c7";
        c.fillRect(x + 48, y - 15, 10, 4);
        c.shadowBlur = 0;
      }
    c.fillStyle = "#142c40";
    c.fillRect(95, 1200, 400, 62);
    c.fillStyle = "#f17faf";
    c.font = "italic bold 25px Georgia";
    c.textAlign = "left";
    c.fillText("AFTER HOURS, BEFORE DAWN", 115, 1240);
    c.font = "bold 17px sans-serif";
    c.fillStyle = "#ffffff55";
    c.textAlign = "center";
    c.fillText("CORAL HEIGHTS", 650, 95);
    c.fillText("PALM DISTRICT", 650, 1290);
    c.fillText("NORTH MARINA", 1455, 95);
    c.save();
    c.translate(1608, 730);
    c.rotate(-Math.PI / 2);
    c.fillText("SUNSET PROMENADE", 0, 0);
    c.restore();
    for (let i = 0; i < 18; i++) {
      const x = ROAD_X[i % 5] + 57,
        y = 300 + Math.floor(i / 5) * 220;
      c.fillStyle = ["#dba4d2", "#70cbbc", "#f0c69b"][i % 3];
      c.beginPath();
      c.arc(x, y, 3.5, 0, 7);
      c.fill();
    }
  }
  private palm(x: number, y: number, seed: number) {
    const c = this.ctx;
    c.strokeStyle = "#13313a66";
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 19, y + 17);
    c.stroke();
    c.strokeStyle = "#b78b75";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - 5, y - 14);
    c.stroke();
    c.save();
    c.translate(x - 5, y - 14);
    c.rotate(seed);
    for (let i = 0; i < 6; i++) {
      c.rotate(Math.PI / 3);
      c.fillStyle = i % 2 ? "#389788" : "#286c64";
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(12, -12, 27, 0);
      c.quadraticCurveTo(12, 3, 0, 0);
      c.fill();
    }
    c.restore();
  }
  private car(car: Car, time: number) {
    const c = this.ctx;
    c.save();
    c.translate(car.x, car.y);
    c.rotate(car.angle);
    c.fillStyle = "#0007";
    c.fillRect(-24, -10, 48, 24);
    c.fillStyle = "#161e30";
    c.fillRect(-18, -15, 9, 4);
    c.fillRect(8, -15, 9, 4);
    c.fillRect(-18, 11, 9, 4);
    c.fillRect(8, 11, 9, 4);
    c.fillStyle = car.health <= 0 ? "#5f6170" : car.color;
    c.beginPath();
    c.roundRect(-24, -12, 48, 24, 5);
    c.fill();
    c.fillStyle = "#213c56";
    c.fillRect(2, -9, 9, 18);
    c.fillRect(-15, -9, 7, 18);
    c.fillStyle = "#fff7cc";
    c.fillRect(20, -10, 3, 5);
    c.fillRect(20, 5, 3, 5);
    c.fillStyle = "#f0639c";
    c.fillRect(-24, -9, 3, 5);
    c.fillRect(-24, 4, 3, 5);
    c.fillStyle = "#ffffff44";
    c.fillRect(12, -9, 7, 18);
    if (car.kind === "police") {
      c.fillStyle = "#222f46";
      c.fillRect(-3, -12, 7, 24);
      c.fillStyle = Math.sin(time * 10) > 0 ? "#ff4e89" : "#4df0ff";
      c.shadowColor = c.fillStyle;
      c.shadowBlur = 14;
      c.fillRect(-2, -7, 5, 14);
      c.shadowBlur = 0;
    }
    if (car.health > 0) {
      const beam = c.createLinearGradient(24, 0, 110, 0);
      beam.addColorStop(0, "#ffebbe1f");
      beam.addColorStop(1, "#ffebbe00");
      c.fillStyle = beam;
      c.beginPath();
      c.moveTo(24, -8);
      c.lineTo(110, -32);
      c.lineTo(110, 32);
      c.lineTo(24, 8);
      c.fill();
    }
    c.restore();
  }
  private marker(
    p: Point,
    label: string,
    time: number,
    reduced: boolean,
    color: string,
  ) {
    const c = this.ctx,
      r = 32 + (reduced ? 0 : Math.sin(time * 3) * 3);
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.fillStyle = color + "18";
    c.beginPath();
    c.arc(p.x, p.y, r, 0, 7);
    c.fill();
    c.stroke();
    c.setLineDash([5, 7]);
    c.beginPath();
    c.arc(p.x, p.y, r + 8, 0, 7);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = color;
    c.font = "bold 10px sans-serif";
    c.textAlign = "center";
    c.fillText(label, p.x, p.y + 58);
  }
  private route(p: Point, target: Point) {
    const c = this.ctx;
    let node = nearestNode(p),
      end = nearestNode(target);
    c.strokeStyle = "#ffd16665";
    c.lineWidth = 5;
    c.setLineDash([8, 12]);
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(nodes[node].x, nodes[node].y);
    for (let i = 0; i < 12 && node !== end; i++) {
      node = nextNode(node, end);
      c.lineTo(nodes[node].x, nodes[node].y);
    }
    c.lineTo(target.x, target.y);
    c.stroke();
    c.setLineDash([]);
  }
  minimap(canvas: HTMLCanvasElement, s: Snapshot) {
    const c = canvas.getContext("2d")!,
      w = canvas.width,
      h = canvas.height,
      sx = w / WORLD.w,
      sy = h / WORLD.h;
    c.clearRect(0, 0, w, h);
    c.fillStyle = "#142c3c";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#226574";
    c.fillRect(1600 * sx, 0, 200 * sx, h);
    c.strokeStyle = "#52667c";
    c.lineWidth = 5;
    for (const x of ROAD_X) {
      c.beginPath();
      c.moveTo(x * sx, 70 * sy);
      c.lineTo(x * sx, 1290 * sy);
      c.stroke();
    }
    for (const y of ROAD_Y) {
      c.beginPath();
      c.moveTo(70 * sx, y * sy);
      c.lineTo(1600 * sx, y * sy);
      c.stroke();
    }
    c.fillStyle = "#a480a4";
    for (const b of buildings)
      c.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
    for (const p of s.cars.filter((car) => car.kind === "police")) {
      c.fillStyle = "#ff6598";
      c.fillRect(p.x * sx - 2, p.y * sy - 2, 4, 4);
    }
    if (s.target) {
      c.strokeStyle = "#ffd166";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(s.target.x * sx, s.target.y * sy, 5, 0, 7);
      c.stroke();
    }
    c.fillStyle = "#76e7ce";
    c.fillRect(SAFE.x * sx - 3, SAFE.y * sy - 3, 6, 6);
    c.save();
    c.translate(s.player.x * sx, s.player.y * sy);
    c.rotate(s.player.angle);
    c.fillStyle = "#fff";
    c.beginPath();
    c.moveTo(6, 0);
    c.lineTo(-4, -4);
    c.lineTo(-4, 4);
    c.fill();
    c.restore();
  }
}
