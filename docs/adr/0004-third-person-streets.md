# An isolated third-person street mission

The top-down courier campaign cannot acquire a third-person foot/combat skill through a visual reskin. A separate simulation and projected 3D polygon renderer provide a small, testable spatial action slice while keeping the finished campaign and its durable saves available. The new mode is the default entry; `?mode=classic` is the old campaign. Separate save namespaces prevent a new mission, retry or reward from resetting the prior four jobs.

Software projection avoids a runtime dependency and downloaded assets, trading advanced materials and large-world performance for a modest district, explicit camera math and deterministic tests. The simulation owns health, aim, jump, car occupancy, wanted sight and mission state. Rendering and UI observe snapshots and submit ordinary input. Shortening the chase camera against buildings prevents it passing through opaque blocks.
