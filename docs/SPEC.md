# Neon Harbor — accepted design

The user delegates recommended design choices and asks for no design questions. The design tree is settled: polished top-down TypeScript canvas, fictional 1987 coastal city, four jobs, lightweight local-only browser stack, no external assets or paid services.

## Acceptance criteria
- A readable continuous city with three distinct neighborhoods, palm-lined roads, beach and marina, an on-foot courier, parked drivable cars, traffic, and police.
- WASD/arrows move; E enters/exits the nearest parked/slow vehicle or interacts with a contact/objective. Space brakes. Vehicles accelerate, steer, reverse, collide and take damage. A recovery command rescues stuck/damaged players.
- Collision uses bounded substeps to prevent tunneling. Exits find a collision-free spot. One occupant and one active vehicle; recovery returns to safehouse without spending rewards.
- Four sequential jobs: timed delivery, recover a specific car, escape pursuit, final pickup/delivery/escape. Contacts have original dialogue, target markers and navigation; retry preserves finished jobs and money; rewards occur once. Campaign completion unlocks free roam.
- Heat rises on traffic impacts and scripted jobs. Police spawn outside a fair radius, pursue on roads, can be escaped; unseen heat always decays. Safehouse repairs and saves.
- Pause, mute and reduced-motion settings; keyboard focus/blur and pointer cancellation clear inputs. Touch directional controls and interaction buttons. Progress auto-saves, corrupt saves safely reset, versioned validation prevents invalid progression.
- Public simulation commands and observations test movement over frame variation, collisions, transitions, recovery, mission order/failure/retry/reward and save corruption. Every authored mission finishes through public commands.
- Local tests/typecheck/build/audit, independent standards/spec reviews, browser campaign and reload verification. Private GitHub commit and CI verified. Session-only localhost port 5186, previous projects untouched.

## Scope
Arcade patrols, lane traffic, simple circular vehicle colliders and a compact map are honest simplifications. No combat or pedestrian injury. No copyrighted source content. A short complete game, not a recreation of a commercial game.

## Test seams and workflow adaptations
Delegated acceptance confirms `Game.command`, `Game.update`, `Game.view`, and `Game.save/load` as public seams. Targeted vertical red-green slices cover collision and progression; visual rendering and UI are verified after implementation, not falsely called TDD. Grill interview recommendations are accepted via delegation. Independent reviewers use initial documentation commit as fixed point. Standards: strict TypeScript, dependency-light modules separated into city/simulation/render/input; no undocumented test-only commands, no secrets, no paid hosting.
