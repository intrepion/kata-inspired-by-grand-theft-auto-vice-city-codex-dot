import * as THREE from "../vendor/three/three.module.min.js";
import {
  blocks,
  covers,
  roadsX,
  roadsZ,
  BOUNDS,
  HOME,
  CONTACT,
  TAPE,
  GARAGE,
  cameraFraction,
} from "./world";
export function createStreetThree(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#ca8f9d");
  scene.fog = new THREE.Fog("#ca8f9d", 130, 280);
  scene.add(new THREE.HemisphereLight("#ffe3ca", "#526c7b", 2));
  const sun = new THREE.DirectionalLight("#fff1da", 1);
  sun.position.set(-30, 80, -20);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.2, 400);
  const mat = (color) => new THREE.MeshLambertMaterial({ color });
  function box(x, y, z, w, h, d, color, parent = scene) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.position.set(x, y + h / 2, z);
    parent.add(m);
    return m;
  }
  box(0, -0.3, 15, 200, 0.2, 240, "#5f8d9b");
  box(0, -0.12, 15, 152, 0.1, 182, "#547677");
  for (const x of roadsX) box(x, 0.01, 15, 16, 0.03, 182, "#414856");
  for (const z of roadsZ) box(0, 0.02, z, 152, 0.03, 16, "#414856");
  for (const x of roadsX)
    for (let z = -72; z < 104; z += 8)
      if (!roadsZ.some((road) => Math.abs(z - road) < 8))
        box(x, 0.05, z, 0.24, 0.02, 3, "#ddc899");
  for (const z of roadsZ)
    for (let x = -72; x < 76; x += 8)
      if (!roadsX.some((road) => Math.abs(x - road) < 8))
        box(x, 0.05, z, 3, 0.02, 0.24, "#ddc899");
  for (const b of blocks) {
    box(b.x, 0.03, b.z, b.w, b.h, b.d, b.color);
    box(b.x, b.h + 0.03, b.z, b.w + 0.4, 0.3, b.d + 0.4, "#dbb9b6");
  }
  for (const b of covers) box(b.x, 0, b.z, b.w, b.h, b.d, b.color);
  function marker(point, color) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.8, 32),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(point.x, 0.07, point.z);
    scene.add(m);
    return m;
  }
  const home = marker(HOME, "#73dec1"),
    garage = marker(GARAGE, "#67cfe8"),
    contact = marker(CONTACT, "#f786b9"),
    tape = marker(TAPE, "#ffd37f");
  function person(color) {
    const g = new THREE.Group();
    box(0, 0.35, 0, 0.65, 1, 0.4, color, g);
    box(0, 1.35, 0, 0.4, 0.45, 0.4, "#efbd9f", g);
    for (const x of [-0.2, 0.2]) box(x, 0, 0, 0.2, 0.5, 0.25, "#263b49", g);
    scene.add(g);
    return g;
  }
  const player = person("#f4a1bd"),
    mira = person("#73dec1"),
    enemies = new Map(),
    cars = new Map();
  mira.position.set(CONTACT.x, 0, CONTACT.z);
  function car(color) {
    const g = new THREE.Group();
    box(0, 0.4, 0, 1.9, 0.7, 3.9, color, g);
    box(0, 1.1, 0, 1.55, 0.65, 1.7, "#5b7087", g);
    for (const x of [-0.95, 0.95])
      for (const z of [-1.2, 1.2])
        box(x, 0.12, z, 0.25, 0.55, 0.65, "#252b39", g);
    scene.add(g);
    return g;
  }
  const traceMat = new THREE.LineBasicMaterial({ color: "#fff4be" }),
    enemyTraceMat = new THREE.LineBasicMaterial({ color: "#ff7588" });
  let traces = [];
  function render(view, w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const back = view.player.vehicle ? 10 : view.aiming ? 5 : 7.5,
      rise = view.player.vehicle ? 4.2 : view.aiming ? 2.2 : 3.4;
    const focus = {
        x: view.player.x,
        y: view.player.y + 1.2,
        z: view.player.z,
      },
      eye = {
        x: focus.x - Math.sin(view.cameraYaw) * back,
        y: focus.y + rise,
        z: focus.z - Math.cos(view.cameraYaw) * back,
      },
      fraction = cameraFraction(focus, eye);
    camera.position.set(
      focus.x + (eye.x - focus.x) * fraction,
      focus.y + (eye.y - focus.y) * fraction,
      focus.z + (eye.z - focus.z) * fraction,
    );
    camera.lookAt(focus.x, focus.y, focus.z);
    player.visible = !view.player.vehicle;
    player.position.set(view.player.x, view.player.y, view.player.z);
    player.rotation.y = view.player.yaw;
    mira.visible = view.phase === "contact";
    contact.visible = view.phase === "contact";
    tape.visible = view.phase === "fight" || view.phase === "tape";
    home.visible = true;
    garage.visible = true;
    for (const e of view.enemies) {
      if (!enemies.has(e.id)) {
        const figure = person("#e09160");
        figure.userData.health = [0, 1, 2].map((i) =>
          box((i - 1) * 0.22, 2.3, 0, 0.17, 0.09, 0.09, "#ffd37f", figure),
        );
        figure.userData.target = box(
          0,
          2.55,
          0,
          0.18,
          0.18,
          0.18,
          "#ffd37f",
          figure,
        );
        enemies.set(e.id, figure);
      }
      const p = enemies.get(e.id);
      p.visible = e.health > 0;
      p.userData.health.forEach((bar, i) => {
        bar.visible = i < e.health;
      });
      p.userData.target.visible = e.id === view.targetEnemy;
      p.position.set(e.x, 0, e.z);
      p.rotation.y = Math.atan2(view.player.x - e.x, view.player.z - e.z);
    }
    const ids = new Set();
    for (const c of view.cars) {
      ids.add(c.id);
      if (!cars.has(c.id)) cars.set(c.id, car(c.color));
      const obj = cars.get(c.id);
      obj.visible = true;
      obj.position.set(c.x, 0, c.z);
      obj.rotation.y = c.yaw;
    }
    for (const [id, obj] of cars) if (!ids.has(id)) obj.visible = false;
    for (const line of traces) {
      scene.remove(line);
      line.geometry.dispose();
    }
    traces = [];
    for (const t of view.traces) {
      const points = [
        new THREE.Vector3(t.from.x, 1.3, t.from.z),
        new THREE.Vector3(t.to.x, 1.3, t.to.z),
      ];
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        t.hostile ? enemyTraceMat : traceMat,
      );
      scene.add(line);
      traces.push(line);
    }
    renderer.render(scene, camera);
  }
  return { render, dispose: () => renderer.dispose() };
}
