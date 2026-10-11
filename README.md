# Neon Harbor

An original top-down arcade city adventure set in a fictional 1987 coastal town. Lena Vale and the Wave crew run four midnight jobs to restore a community radio station. Palm boulevards, coral rooftops, a marina, original synthesized ambience, and a complete compact campaign. Broad open-city driving inspiration only: no Rockstar assets, characters, map, dialogue or music.

## Play locally

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:5186/**. `npm start` launches a detached, session-only production preview. It survives the task/terminal finishing, but not logout/reboot or manual process termination. It prints its PID and stop command; logs are at `/tmp/neon-harbor-5186.log`. No login items, launch agents, public hosting or security changes. To restart after a reboot: run `npm start` from this repository. If dependencies or source changed, run `npm ci` and `npm run build` first. `npm run dev` is the foreground development alternative on the same reserved port.

Ports 5173–5185 and previous repositories are untouched. Only localhost is bound. If another service owns 5186, inspect it before stopping anything.

## Controls

| Action | Keyboard | Pointer/touch |
|---|---|---|
| Walk / accelerate / reverse / steer | WASD or arrows | Direction pad at narrow widths |
| Enter / exit / objective / contact | E | Interact button |
| Brake | Space | Brake button |
| Recover to home | R | Recover button |
| Retry failed job | T | Retry button |
| Pause / settings | P or Escape | Pause button |
| Mute | M | Music button / settings |

Start by pressing **E at home** to accept a job, then **E again** to enter the pink loaner. Drive toward the gold route, slow down at the ring, and press E to hand over cargo. Cars steer only while moving; reverse steering follows arcade car behavior. Stop before exiting. Home repairs cars and cools patrol attention. Recovery interrupts an active job, with all previous rewards preserved. Retry resets the current job and loaner. Finished jobs save automatically; transient car/heat/job state resets on reload so recovery stays available. Settings include reduced motion and original synth mute. New Campaign in settings uses a two-click confirmation and resets local progress for replay.

## The four jobs

1. **Midnight frequency:** timed transmitter delivery to the promenade.
2. **Borrowed sunshine:** find and return the specific yellow Sunbird.
3. **Static on the line:** relay activation, pursuit escape, and return home.
4. **Before the dawn:** collect the master tape, deliver it, escape, and return for the broadcast.

After completion, all four rewards total **$3,650** and free roam remains playable. Money is a completion score, not a shop economy. Safehouse is the green home marker. Gold is the current objective; pink minimap dots are patrols.

## Verification and engineering

```sh
npm test
npm run typecheck
npm run format:check
npm run build
npm audit --audit-level=high
```

See [acceptance criteria](docs/SPEC.md), [glossary](CONTEXT.md), [architecture decisions](docs/adr), and [verification evidence](docs/VERIFICATION.md). The simulation's public seams are `Game.command`, `Game.update`, `Game.view`, `Game.save/load`. UI never mutates simulation snapshots. CI runs formatting, tests, typechecked production build and dependency audit.

## Honest scope

Canvas 2D with raised building roofs, not a 3D engine. A compact 5-by-4 road grid with 12 named buildings, three districts and waterfront dressing, not a AAA city. Traffic follows lanes and patrols follow intersections; AI yields when approaching an occupied stopped car but the driver still needs to avoid traffic. Buildings and parked-car contacts use bounded movement; cars use circles rather than rotated body polygons. Moving AI contacts use a simplified cooldown impact response. Long frame stalls are capped to prevent jumps; losing browser focus pauses. Heat is temporary arcade attention, with line-of-sight cooling and a guaranteed safehouse escape. No combat, injury simulation, interiors, multiplayer, vehicle tuning or licensed radio tracks. Coordinates/speed are arcade scale. Keyboard play is the primary device target; narrow-screen pointer controls and responsive presentation are verified in Chrome emulation, not on physical phones. Saves are browser-local; clearing site data removes them. Audio can be unavailable under browser policy and is optional.

Repository folder is present on this Mac. No supported project/sidebar registration API was available; folder creation does not imply a separate registered sidebar project.
