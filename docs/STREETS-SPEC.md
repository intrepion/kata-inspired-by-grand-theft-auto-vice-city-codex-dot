# Street mission — fidelity slice

The October 14 audit found that an overhead courier game omitted Vice City's defining third-person foot/vehicle action. The bounded correction is one playable street mission in an original small coastal district, with an actual perspective chase camera and camera-relative movement. This is not a full recreation or campaign.

## Research and settled decisions

Primary source: [Rockstar's original PC Tourist Guide](https://store.steampowered.com/manual/12110), printed pages 4–9. The controls spread and Getting Around describe vehicle taking, acceleration, sprint stamina and driving; Facts for the Visitor documents left-mouse firing, weapon categories and police escalation. OCR loses key labels, so the slice does not claim exact default bindings or original handling measurements. The existing audit's camera finding is corroborated by its gameplay source; no original executable was run.

The user delegates optional decisions. Grill with Docs/domain modeling therefore records recommended defaults rather than holding an interview. Implement's commit step is overridden by the user's explicit local-only/no-commit instruction. The accepted public test seam is `StreetGame.command/update/look/view/save`: ordinary input and observable state, without teleport/debug completion commands. Parent coordinates independent standards/spec review and browser access.

## Acceptance contract

- Third-person perspective with a visible courier and vehicle, camera orbit, follow/aim distance, collision-shortened camera, road/building occlusion and a minimap. Camera-relative walking, finite sprint stamina, jump, aiming/fire and a slow/nearby vehicle entry/exit transition.
- Cars accelerate, brake, reverse, steer by speed, handbrake, collide and lose condition. Ambient road traffic and police pursuit share the district.
- One mission: meet a contact, defeat two armed blockers with aim/fire, collect a tape, take a vehicle, escape wanted attention, and return for a once-only reward. Police sight uses building obstruction; unseen attention decays. A marked repaint garage provides an alternate paid escape. Failure/retry remains recoverable.
- Pause stops simulation, blur pauses and clears input, mouse and keyboard alternatives work without requiring pointer lock. Original art and dialogue. No automatic firing or invisible mission completion.
- New progress uses `neon-harbor.streets.v1`. The previous campaign is available at `?mode=classic`; its files and storage key are retained. New slice is default, also available at `?mode=streets`.
- Focused simulation tests, existing regressions, strict typecheck, serialized production build, independent review and a normal-input browser completion. Automated public-input completion is supporting evidence, not browser acceptance.

## Limits

Small flat district and software polygon renderer, arcade collision and traffic AI; two weapons (unarmed and pistol), two enemies and one mission. No full city, interior/property economy, motorcycles/boats/aircraft, drive-by shooting or original licensed content. Keyboard/mouse is the verified target; no gamepad/mobile claim. Original handling and free-camera settings were not numerically reproduced.
