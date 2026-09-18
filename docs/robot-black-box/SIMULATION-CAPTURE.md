# Observed passive simulation capture

MuJoCo 3.13.0 executed the existing passive sphere-drop model for 1,000 steps at a 0.002-second timestep. The sampler retains every tenth step: 100 observed samples containing position (world XYZ metres), linear velocity (world XYZ metres/second), and model contact count. These values come from the executed engine, rather than hand-authored fixture values. The original 1,000-step metrics and G21 integration remain available.

The sampler writes source samples, model and execution metadata. The recorder then ingests these observed files through its existing SQLite/signature/witness pipeline. This is file-mediated replay of actual simulator output, not a live physical source connection. Each signed observation carries source step/time/host timestamps and an independently observed adapter receive monotonic timestamp. Recorder received_at is the signed local host wall-clock receipt time. Source-output SHA-256 is pinned by the metadata, signed envelopes and signed artifact manifest. Model bytes and engine version are retained as public artifacts.

The synthetic v2 capture profile declares simulation_elapsed, an artificial observation epoch of 2000-01-01, and an uncalibrated_local_host receipt domain. Envelope monotonic_ns and observed_at represent the simulator's elapsed offsets against that artificial epoch. Synchronized means internal simulation offset alignment only; it does not imply synchronization with host or physical clocks. Python source wall/monotonic observations and Node adapter/recorder receipt observations remain separate. No cross-clock mapping, calibrated latency, real-source freshness, sensor calibration or sim-to-real assessment is inferred.

The existing signed event schema is preserved. run.started additionally accepts benign_passive_capture; it issues no actuator proposal, grant or execution. Existing handover actions and signed v1 capture profiles retain their behavior. The v2 signed profile adds exact clock-domain declarations and a local receipt-interval bound. Only v2 diagnoses duplicate/decreasing channel offsets and local receipt intervals. The 21 ms source interval and 100 ms local receipt interval are declared demonstration thresholds, not hardware sampling guarantees. Profiles expire normally; review does not renew them.

| Case | Observations | Integrity | Capture | Concrete result |
|---|---:|---|---|---|
| Observed baseline | 300 | valid | unknown | Declared source cadence satisfied; calibration and physical capture unknown |
| Dropped sample | 297 | valid | fail | Count mismatch and a 40 ms source interval |
| Duplicate sample | 303 | valid | fail | Count mismatch and non-increasing source offsets |
| Out of order | 300 | invalid | unknown | Existing verifier rejects monotonic rollback and withholds trusted facts |
| Delayed receipt | 300 | valid | fail | An actual 200 ms local wait exceeds the declared receipt interval |

The four fault streams are explicitly labeled derivatives of the same observed source. They do not represent additional simulated physics executions. Their new event IDs allow source duplicates to be recorded without conflicting recorder identity deduplication. The out-of-order stream remains signed/anchored as recorded; the existing verifier's integrity result also checks envelope ordering, so valid cryptographic signatures alone do not make this stream valid evidence. No verifier rule was weakened.

Reproduce with fresh output directories:

```sh
.rbb/simulation-runtime/bin/python scripts/robot-black-box/simulation-demo.py .rbb/new-simulation-source
node scripts/robot-black-box/simulation-capture-execute.mjs .rbb/new-simulation-source .rbb/new-simulation-capture --private-only
```

The executor refuses existing private output. The repeat command retains private outputs without publication. Omitting --private-only publishes only to the fixed public destination and refuses an existing destination; do not delete delivered signed cases just to repeat a run. The fixed public destination is examples/robot-black-box-simulation-capture/executed. It includes five signed bundles/diagnostic receipts, public trust/witness snapshots, execution metadata and fresh-process-review.json. No private keys or private custody database are published. The original fixed 46-entry portable acceptance package is unchanged; simulation evidence is outside that profile.

`npm run review:robot-black-box` now includes a separate simulation object, source digests and bounded citations. The console retains eight evidence layers and appends five simulator rows to the six authored capture cases. Passive capture authorization is explicitly not applicable. Tenant, role, purpose and origin controls apply to the additional citations. Physical survivability, equipment/installation qualification, live hardware sampling and independent/off-host custody remain separate investment gates.

Validation: all 118 local tests passed, including three simulation integration tests. A fresh process reverified all five receipts against their bundles and recomputed each diagnostic exactly. Actual browser checks displayed eight cards, eleven rows and five investment gaps; the baseline citation displayed its signed clock declarations without private paths. The mobile document remained 390 pixels wide, and no browser errors occurred. Screenshot and unsigned browser verification record are alongside the public simulation evidence. No remote CI, paid service, live robot control or proprietary inference was used.
