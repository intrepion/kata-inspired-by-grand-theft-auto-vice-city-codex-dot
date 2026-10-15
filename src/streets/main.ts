import "./style.css";
import { StreetGame, type StreetInput } from "./game";
import { StreetRenderer } from "./render";
import { distance } from "./world";

const SAVE = "neon-harbor.streets.v1";
let saved: string | null = null;
try {
  saved = localStorage.getItem(SAVE);
} catch {
  /* Optional storage. */
}
const game = new StreetGame(saved);
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `<main class="street-shell">
  <canvas id="street-view" tabindex="0" aria-label="Third-person Neon Harbor street mission. WASD movement, E interact, L aim, J fire, Space jump or handbrake."></canvas>
  <header class="street-brand"><span>NEON <b>HARBOR</b></span><small>STREET SIGNAL · A THIRD-PERSON ACTION SLICE</small></header>
  <div class="street-stats"><div id="stars" aria-label="Wanted level"></div><b id="cash"></b><span id="weapon"></span><label>HEALTH <meter id="health" min="0" max="100" value="100"></meter></label><label id="reserve-label">STAMINA <meter id="stamina" min="0" max="100" value="100"></meter></label><button id="pause-street">PAUSE · P</button></div>
  <aside class="street-mission"><small id="phase">01 / MEET THE CONTACT</small><h1>Street signal.</h1><p id="objective"></p><b id="proximity"></b><p class="street-message" id="status" role="status"></p></aside>
  <div class="street-radar"><div><b>NEON HARBOR</b><span>N ↑</span></div><canvas id="street-map" width="204" height="224" aria-label="Radar: gold objective, green Wave FM, cyan repaint, pink patrols."></canvas><small>◆ JOB &nbsp; <span>◆ REPAINT</span> &nbsp; ● POLICE</small></div>
  <div class="street-reticle" id="reticle" aria-hidden="true">＋</div><div class="street-speed" id="speed"></div>
  <footer class="street-controls"><span><kbd>WASD</kbd> MOVE / DRIVE</span><span><kbd>E</kbd> INTERACT / CAR</span><span><kbd>SHIFT</kbd> SPRINT</span><span><kbd>SPACE</kbd> JUMP / HANDBRAKE</span><span><kbd>L</kbd> AIM <kbd>J</kbd> FIRE <kbd>F</kbd> RELOAD</span><span><kbd>Z X</kbd> CAMERA / DRAG MOUSE</span><span><kbd>1 2</kbd> WEAPON <kbd>R</kbd> RETRY</span></footer>
  <div class="street-overlay" id="street-intro"><section><div class="street-eyebrow">WAVE FM PRESENTS / 1987</div><h2>Street<br><em>signal.</em></h2><p>They took the station's master tape.<br>Meet Mira, clear the yard, take a car and bring it home — with the police off your tail.</p><button class="street-primary" id="start-street">${game.view().completed ? "CONTINUE THE NIGHT" : "STEP INTO THE STREETS"} ↗</button><div class="street-guide"><p><b>On foot</b> WASD moves relative to the camera. Shift sprints, Space jumps. Hold right mouse or L to aim; left mouse or J fires. F reloads.</p><p><b>At the wheel</b> E enters a nearby slow car. W accelerates, S brakes/reverses, A/D steers, Space handbrakes. Stop to exit.</p><p><b>Camera</b> Drag the mouse or hold Z/X to orbit. Escape/P pauses. R retries the mission. Keyboard alternatives require no pointer lock.</p></div><a href="?mode=classic">Original four-job courier campaign ↗</a><small class="street-scope">One small original district and one action mission. Progress is separate from the original campaign.</small></section></div>
  <div class="street-overlay street-hidden" id="street-pause"><section><div class="street-eyebrow">TAKE A BREATHER</div><h2>City paused.</h2><p>Movement, pursuit and combat are stopped.</p><button class="street-primary" id="resume-street">BACK TO THE STREETS ↗</button><button id="retry-street">RETRY STREET MISSION · SAVED REWARDS STAY</button><a href="?mode=classic">Original courier campaign ↗</a></section></div>
</main>`;
const element = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id)! as T;
const canvas = element<HTMLCanvasElement>("street-view"),
  map = element<HTMLCanvasElement>("street-map");
const renderer = new StreetRenderer(canvas),
  keys = new Set<string>(),
  buttons = new Set<number>();
let drag = false,
  lastSave = game.save();
function clearInput() {
  keys.clear();
  buttons.clear();
  drag = false;
}
function pause() {
  if (!game.view().started) return;
  clearInput();
  game.command("pause");
  element("street-pause").classList.toggle(
    "street-hidden",
    !game.view().paused,
  );
  if (game.view().paused) element("resume-street").focus();
  else canvas.focus();
}
element("start-street").onclick = () => {
  game.command("start");
  element("street-intro").classList.add("street-hidden");
  canvas.focus();
};
element("pause-street").onclick = pause;
element("resume-street").onclick = pause;
element("retry-street").onclick = () => {
  pause();
  game.command("retry");
};
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase(),
    view = game.view();
  if (
    (event.target as HTMLElement).tagName === "BUTTON" &&
    (key === " " || key === "enter")
  )
    return;
  if (
    view.started &&
    [" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)
  )
    event.preventDefault();
  if (event.repeat) return;
  if (key === "escape" || key === "p") {
    pause();
    return;
  }
  if (
    !view.started ||
    view.paused ||
    (event.target as HTMLElement).tagName === "BUTTON"
  )
    return;
  keys.add(key);
  if (key === "e") game.command("interact");
  if (key === " ") game.command("jump");
  if (key === "r") game.command("retry");
  if (key === "f") game.command("reload");
  if (key === "1") game.command("fists");
  if (key === "2") game.command("pistol");
});
window.addEventListener("keyup", (event) =>
  keys.delete(event.key.toLowerCase()),
);
canvas.oncontextmenu = (event) => event.preventDefault();
canvas.onpointerdown = (event) => {
  if (!game.view().started || game.view().paused) return;
  event.preventDefault();
  canvas.focus();
  canvas.setPointerCapture(event.pointerId);
  buttons.add(event.button);
  drag = true;
};
canvas.onpointermove = (event) => {
  if (drag) game.look(event.movementX * 0.006);
};
canvas.onpointerup = (event) => {
  buttons.delete(event.button);
  if (!buttons.size) drag = false;
};
canvas.onpointercancel = clearInput;
canvas.onlostpointercapture = clearInput;
window.addEventListener("blur", () => {
  clearInput();
  if (game.view().started && !game.view().paused) pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInput();
    if (game.view().started && !game.view().paused) pause();
  }
});
let previous = performance.now(),
  hudTime = 0;
function frame(now: number) {
  const dt = Math.min(0.1, (now - previous) / 1000);
  previous = now;
  const input: StreetInput = {
    forward:
      Number(keys.has("w") || keys.has("arrowup")) -
      Number(keys.has("s") || keys.has("arrowdown")),
    side:
      Number(keys.has("d") || keys.has("arrowright")) -
      Number(keys.has("a") || keys.has("arrowleft")),
    aim: keys.has("l") || buttons.has(2),
    fire: keys.has("j") || buttons.has(0),
    sprint: keys.has("shift"),
    brake: keys.has(" "),
  };
  if (keys.has("z") || keys.has("x"))
    game.look((Number(keys.has("x")) - Number(keys.has("z"))) * dt * 1.8);
  game.update(dt, input);
  const view = game.view();
  renderer.render(view);
  renderer.minimap(map, view);
  hudTime += dt;
  if (hudTime > 0.06) {
    hudTime = 0;
    element("stars").textContent =
      "★".repeat(view.wanted) + "☆".repeat(3 - view.wanted);
    element("stars").classList.toggle("street-cooling", view.unseen > 2);
    element("stars").setAttribute(
      "aria-label",
      `Wanted level ${view.wanted} of 3${view.unseen > 2 ? ", losing sight" : ""}`,
    );
    element("cash").textContent = "$" + view.money.toLocaleString();
    element("health").setAttribute("value", String(view.health));
    const car = view.cars.find((vehicle) => vehicle.id === view.player.vehicle);
    element("stamina").setAttribute(
      "value",
      String(car ? car.health : view.stamina),
    );
    element("reserve-label").firstChild!.textContent = car
      ? "BODYWORK "
      : "STAMINA ";
    element("weapon").textContent = car
      ? "AT THE WHEEL"
      : view.weapon === "fists"
        ? "UNARMED · 2 PISTOL"
        : view.reload
          ? "RELOADING…"
          : `PISTOL ${view.magazine} / ${view.reserve}`;
    element("objective").textContent = view.objective;
    element("status").textContent = view.message;
    element("phase").textContent = {
      contact: "01 / MEET THE CONTACT",
      fight: "02 / CLEAR THE YARD",
      tape: "03 / RECOVER THE TAPE",
      escape: "04 / LOSE THE POLICE",
      return: "05 / BRING IT HOME",
      complete: "JOB PASSED / FREE ROAM",
      failed: "JOB FAILED / R TO RETRY",
    }[view.phase];
    element("proximity").textContent =
      `${Math.round(distance(view.player, view.target))} m to marker${view.garageTime ? ` · repainting ${Math.round((view.garageTime / 2.5) * 100)}%` : view.bust > 0.5 ? " · POLICE CLOSE — MOVE!" : ""}`;
    element("speed").textContent = car
      ? `${Math.round(Math.abs(car.speed) * 3.6)} km/h`
      : "ON FOOT";
    element("reticle").classList.toggle("street-hidden", !view.aiming);
    element("reticle").classList.toggle(
      "street-locked",
      view.targetEnemy !== null,
    );
    const progress = game.save();
    if (progress !== lastSave) {
      try {
        localStorage.setItem(SAVE, progress);
      } catch {
        /* Playing remains possible without storage. */
      }
      lastSave = progress;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
