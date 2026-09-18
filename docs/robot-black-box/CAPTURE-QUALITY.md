# Signed synthetic capture-quality diagnostics

A valid signed record can contain inadequate capture data. The read-only verifier now assesses declared sensor channels, counts, units/coordinate frame, observation-time ordering, monotonic interval and clock comparability separately from record integrity and action authorization. It never asserts calibrated physical capture or current online sensor freshness.

[Module](../../packages/robot-black-box-verifier/src/capture-quality.mjs), [execution](../../examples/robot-black-box-capture-quality/executed/execution.json), [new-process recovery](../../examples/robot-black-box-capture-quality/executed/recovery.json) and [tests](../../scripts/test-robot-black-box-capture-quality.mjs) are inspectable. The local profile supports only synthetic_replay and explicitly unverified synthetic calibration declarations. It is a new sidecar contract, not an aviation parameter table or change to the existing event wire format.

CAPTURE-PROFILE is signed by an enrolled authority and pins tenant/system/run, mode, issue interval and bounded unique sensor channels. Each channel declares units, frame, clock, maximum uncertainty, expected count and optional maximum interval. Invalid signature, revoked/untrusted issuer, scope/schema mismatch or expired profile yields unknown. Invalid signed facts yield unknown without using them. Unknown expected physical capture counts are not inferred. Counts are evaluated as final only after a recorded run closure; an open stream remains unknown if a channel/count has not yet been observed. Cadence uses monotonic time without discarding sub-millisecond precision; incomparable clock domains remain unknown. These predicates concern the supplied record/profile, not hardware truth.

| Executed case | Signed integrity | Capture quality | Reason |
| --- | --- | --- | --- |
| Declared baseline | valid | unknown | Sampling unspecified, calibration unverified, no live capture |
| Missing required channel | valid | fail | Closed synthetic run lacked the signed profile's channel |
| Wrong units | valid | fail | Profile/payload units mismatch |
| Observation wall-time rollback | valid | fail | Observed time moved backwards within a declared common clock |
| Cadence gap | valid | fail | Two declared observations were 500 ms apart against a 100 ms maximum |
| Uncertain clock | valid | unknown | Clock uncertainty prevented a definite quality claim |

All six receipts are separately producer-signed with CAPTURE-QUALITY. A fresh process authenticated each receipt, verified the original bundle and recomputed its report byte-for-byte as of the original evaluation time. Recompute does not renew an expired profile or declare a live source. Original handover/governance benchmarks and signed artifacts were preserved.

## Execute and recover

```sh
node scripts/robot-black-box/capture-quality-execute.mjs .rbb/capture-quality-new
node scripts/robot-black-box/capture-quality-recover.mjs .rbb/capture-quality-new
node --test scripts/test-robot-black-box-capture-quality.mjs
```

Execution requires a fresh output directory and no network/model download. Private custody remains under .rbb. Public samples contain only synthetic records and public keys. Standalone CLI assessment is also available:

```sh
node packages/robot-black-box-cli/src/index.mjs capture-quality \
  --bundle examples/robot-black-box-capture-quality/executed/cases/declared_baseline \
  --trust examples/robot-black-box-capture-quality/executed/trust.json \
  --heads examples/robot-black-box-capture-quality/executed/latest-heads.json \
  --profile examples/robot-black-box-capture-quality/executed/cases/declared_baseline/capture-profile.json \
  --out .rbb/capture-current.json
```

Exit 2 means fail and exit 3 means unknown; there is no synthetic physical-quality pass. The current-time command will report an expired profile once the demonstration's one-minute validity interval has elapsed. For deliberately historical recomputation, pass --at with the executed receipt's at timestamp and label the result as historical. Profiles cannot be silently extended, and recent received_at values cannot make synthetic observation time current.

The aircraft comparison motivating the improvement is [the technical comparison](AIRCRAFT-BLACK-BOX-COMPARISON.md), with a [stakeholder one-page table](AIRCRAFT-BLACK-BOX-ONE-PAGE.md). No hardware crash/fire/pressure/immersion test, sensor calibration, microphone capture, private source or live control path is introduced.

## Verified checks

The full Robot Black Box suite passed 40/40 tests, preserving the prior 36 checks. New tests cover six executed/recomputed signed cases, altered artifact/profile, expired/revoked/untrusted authority, open-stream missing-count uncertainty, sub-millisecond cadence and cross-clock comparison. Workspace ESM build/syntax and git diff --check passed. The independent Python/OpenSSL reader accepted the time-rollback bundle as cryptographically valid, corroborating why temporal quality must be evaluated separately. CI is configured but was not remotely run. Comparison/guide local links and public evidence private-key scans passed; source inventory now contains 142 source files. No unchanged host-suite failure or full repository build is claimed fixed by these checks.

Observed passive MuJoCo sample capture now records 100 engine samples across three channels (300 baseline observations) through the existing signed recorder and witness. Dropped, duplicate and delayed-receipt derivatives fail diagnostics; out-of-order source offsets trigger the existing integrity rejection. All 118 local tests passed. Simulation/host clocks and file-mediated ingestion remain explicit, with no physical calibration or live-source claim. See [SIMULATION-CAPTURE.md](SIMULATION-CAPTURE.md).
