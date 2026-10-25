# Neon Harbor

An original coastal city adventure set in a fictional 1987 town. The default **Street Signal** mode is a bounded third-person action slice: walk, sprint, jump, aim/fire, take a car, drive under police pursuit, escape and deliver a recovered station tape. The original four-job overhead courier campaign remains at **[?mode=classic](http://localhost:5186/?mode=classic)**. No Rockstar assets, characters, map, dialogue or music.

## Street Signal — new default mode

Open **http://localhost:5186/** (or `?mode=streets`). Start, walk forward to Mira's pink marker and press E. Head up the boulevard, hold L/right mouse to aim and J/left mouse to fire at the two armed blockers. Collect the gold tape with E, take the pink coupe nearby, lose pursuit or stop in the cyan repaint marker, then return to the green Wave FM marker and press E while stopped. The once-only job reward is $750. You begin with $200; repaint costs $100 and repairs the car. The radar shows the objective, garage and patrols.

| Action                                             | Controls                          |
| -------------------------------------------------- | --------------------------------- |
| Camera-relative walk / throttle, brake and reverse | WASD or arrows                    |
| Sprint with finite stamina                         | Hold Shift                        |
| Jump on foot / handbrake in car                    | Space                             |
| Aim / fire                                         | Hold right / left mouse, or L / J |
| Reload / unarmed / pistol                          | F / 1 / 2                         |
| Camera orbit                                       | Drag mouse or hold Z / X          |
| Contact, collect, enter / exit a slow car, deliver | E                                 |
| Pause / resume                                     | P or Escape                       |
| Retry street mission, preserving earned reward     | R                                 |

This is one small flat 3D district and one action mission, with projected polygon art, original story, arcade car collision/AI, road traffic, two enemies, pistol/unarmed selection and a chase/aim camera. It is not a full recreation or full campaign. No interiors, property business, drive-by shooting, boats, helicopters, original handling measurements, licensed audio or touch/gamepad verification. Foot combat, vehicle taking, camera-relative traversal and wanted escape are the fidelity focus. New progress uses `neon-harbor.streets.v1`; the original `neon-harbor.progress.v1` save is untouched. The new slice is silent; original synth audio remains in the classic mode.

Research, accepted defaults, public test seam and remaining acceptance gaps are in [Street Signal specification](docs/STREETS-SPEC.md) and [verification](docs/STREETS-VERIFICATION.md). Automated simulation completion supports reachability; normal-input browser acceptance is recorded separately.

## Play locally

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:5186/**. `npm start` launches a detached, session-only production preview. It survives the task/terminal finishing, but not logout/reboot or manual process termination. It prints its PID and stop command; logs are at `/tmp/neon-harbor-5186.log`. No login items, launch agents, public hosting or security changes. To restart after a reboot: run `npm start` from this repository. If dependencies or source changed, run `npm ci` and `npm run build` first. `npm run dev` is the foreground development alternative on the same reserved port.

Ports 5173–5185 and previous repositories are untouched. Only localhost is bound. If another service owns 5186, inspect it before stopping anything.

## Original courier campaign controls (`?mode=classic`)

| Action                              | Keyboard       | Pointer/touch                  |
| ----------------------------------- | -------------- | ------------------------------ |
| Walk / accelerate / reverse / steer | WASD or arrows | Direction pad at narrow widths |
| Enter / exit / objective / contact  | E              | Interact button                |
| Brake                               | Space          | Brake button                   |
| Recover to home                     | R              | Recover button                 |
| Retry failed job                    | T              | Retry button                   |
| Pause / settings                    | P or Escape    | Pause button                   |
| Mute                                | M              | Music button / settings        |

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

## Original courier campaign scope

Canvas 2D with raised building roofs, not a 3D engine. A compact 5-by-4 road grid with 12 named buildings, three districts and waterfront dressing, not a AAA city. Traffic follows lanes and patrols follow intersections; AI yields when approaching an occupied stopped car but the driver still needs to avoid traffic. Buildings and parked-car contacts use bounded movement; cars use circles rather than rotated body polygons. Moving AI contacts use a simplified cooldown impact response. Long frame stalls are capped to prevent jumps; losing browser focus pauses. Heat is temporary arcade attention, with line-of-sight cooling and a guaranteed safehouse escape. No combat, injury simulation, interiors, multiplayer, vehicle tuning or licensed radio tracks. Coordinates/speed are arcade scale. Keyboard play is the primary device target; narrow-screen pointer controls and responsive presentation are verified in Chrome emulation, not on physical phones. Saves are browser-local; clearing site data removes them. Audio can be unavailable under browser policy and is optional.

Repository folder is present on this Mac. No supported project/sidebar registration API was available; folder creation does not imply a separate registered sidebar project.

## Play online

[Play the hosted game](https://intrepion.github.io/kata-inspired-by-grand-theft-auto-vice-city-codex-dot/)
