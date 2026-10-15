# Street Signal local verification — 2026-10-15

> Final local native acceptance completed on 2026-10-15. See [final acceptance](LOCAL_ACCEPTANCE_2026-10-15.md) for current browser evidence; pending entries below describe the earlier source handoff.


## Evidence so far

- Baseline: exact audited repository verified, working tree clean before this correction. No applicable AGENTS.md in the repository or ancestors. The original game implementation is retained; the HTML entry now selects the new mode by default or old mode with `?mode=classic`.
- Primary research: [Rockstar PC Tourist Guide/manual](https://store.steampowered.com/manual/12110), printed pp.4–9. Vehicle taking/acceleration, finite sprint, firearms and police escalation informed the slice. Exact original camera settings/handling were not measured. New bindings are documented, with mouse and keyboard alternatives.
- `tests/streets.test.ts` exercises camera-relative sprint/jump, pause and snapshot isolation, building-obstructed fire and finite reload, corrupt/old save rejection, and a full mission through ordinary public input. The full route walks to Mira, accepts the job, walks up the boulevard, aims/fires, collects the tape, takes the coupe, steers/drives/brakes to the repaint garage, clears pursuit, drives home and delivers. It verifies once-only reward and retained progress after retry/reload. No teleport, state injection, invulnerability or mission-completion hooks.
- The solver exposed a patrol approach overshoot that could push a stopped car out of the garage. Patrol approach now slows with distance. A separate transition correction allows taking a car after wanted attention has already cooled on foot.

## Check status

Applied to the original audited repository after a clean-status guard, using the authorized filesystem escalation. Original baseline HEAD: `17c49e3facc5ea1690c4d26267e6d7edf8098910`. No commits or pushes.

- `npm test -- --cache=false`: **27/27 tests passed** across five files after independent-review corrections (18 retained campaign/physics regressions, eight street cases and one UI-handler regression).
- `npm run typecheck`: **passed**.
- `npm run format:check`: **passed**.
- `npm run build`: **passed**, final Vite build 16 modules, 75 ms. The parent granted an exclusive build slot, released after completion.
- Port 5186 listener observed as PID 32764 before the new build; this worker did not stop or restart it. The parent owns preview/browser coordination.

Normal-input browser acceptance and visual camera QA are **pending** and reserved for the parent. This worker has not opened or controlled a native browser. Simulation tests are not browser evidence. The original preview process remains in place; the parent verifies served build freshness and browser behavior.

Independent standards/specification findings and their tested corrections are recorded in [review resolutions](STREETS-REVIEW.md). Parent now coordinates native browser input; this worker continues source work only.

## Acceptance route for browser handoff

1. Open port 5186 root, start; verify third-person courier and street depth, Z/X orbit, WASD relative movement, sprint stamina and a Space jump.
2. Walk roughly 8 m forward to pink Mira; E accepts. Head north toward tape; from about 20–25 m away hold L and J to defeat both blockers. Observe ammunition and target health, use F to reload if needed.
3. Walk to gold tape marker; E collects and sets two stars. The pink coupe is slightly south/east. Approach and E enters. Verify chase camera, throttle/steer/reverse/braking, stop/exit/reenter.
4. Drive south toward the central intersection, east to cyan garage; stop inside for 2.5 s. Observe $100 fee, color/condition repair and wanted clear. Alternatively evade behind blocks until stars cool.
5. Return west to green Wave FM at the central intersection; stop and E. Observe JOB PASSED, $750 reward and free roam. Reload verifies separate new progress. Visit `?mode=classic` and verify original campaign/save still available.
6. Verify P/Escape pause and blur pause, input clears on resume; R retries with earned reward retained. Camera near buildings must shorten rather than pass through blocks.

### Fixed-key route to assist the browser operator

This route was separately exercised in the simulation with only binary held inputs and commands. It is a guide, not a browser script or browser evidence. Timings assume a fresh start and untouched camera; the operator must react to the actual rendered state. Pausing for inspection can stop the city between steps.

| Step                            | Keys / seconds                   | Simulation checkpoint                     |
| ------------------------------- | -------------------------------- | ----------------------------------------- |
| Meet contact                    | W 1.66; E                        | Mira accepts at z≈4                       |
| Clear yard                      | Shift+W 2.0; L+J 2.0             | z20, both blockers down, health100        |
| Collect tape                    | Shift+W 3.6; E                   | z48.64, two stars                         |
| Take coupe                      | S1.5; D1.0; E                    | (5,39), car faces south                   |
| Reach central intersection      | W2.6; Space1.0                   | (5,4.32), stopped                         |
| Turn east                       | W+A1.32                          | (11.27,-0.53), heading east               |
| Repaint                         | W1.6; Space1.0; remain braked3.0 | (47.64,0.57), $100, wanted0, teal car     |
| Turn west around parked patrols | W+D+Space3.8                     | (47.72,-4.26), heading west in lower lane |
| Deliver                         | W2.85; Space1.0; E               | (2.73,-5.13), JOB PASSED, $850, wanted0   |

The fixed route ended with courier health100 and coupe condition100. It does not exercise off-route navigation or substitute for independent browser camera/input QA.

## Limits

Software painter's-order polygon rendering can show depth artifacts near intersecting meshes; no hardware depth buffer. Flat compact district and circular car collision are arcade approximations. Two enemies have simple sight/cooldown fire, police use a small road graph and direct short-range pursuit. No full Vice City recreation, campaign or blind recognition test. No gamepad/mobile/audio acceptance in this mode.
