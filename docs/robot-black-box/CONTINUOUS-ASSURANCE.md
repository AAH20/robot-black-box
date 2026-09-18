# Bounded local assurance and durable GRC reports

The executed local workflow schedules checkpoints, journals signed check results across process restarts, rotates a producer into a new single-key run epoch, and commits digest-bound report bytes into SQLite. It checks benign synthetic replay. A recent local verification time never establishes current online sensor freshness.

[Executed operational receipt](../../examples/robot-black-box-governance/executed/operational-assurance-execution.json) records nine scheduled checks across six worker processes, with a 40 ms demonstration interval. [Witnessed G25 binding](../../examples/robot-black-box-governance/executed/operational-binding.json) binds its exact bytes. G25 integrity is valid; its governance result is unknown with ONLINE_SOURCE_FRESHNESS_NOT_OBSERVED. The commercial console displays the operational scope, provenance, result digests and a separate durable report acknowledgement. Existing benchmarks and signed cases are retained.

The first worker checked a two-event partial stream twice. After the remaining events committed, an injected checkpoint persistence failure occurred after the real witness had anchored the head. The failure stayed incomplete; a fresh worker recomputed the same checkpoint and reconciled the witness receipt, persisted it, exported new snapshots and verified the six-event closed run. Every snapshot uses a new path. Later failures preserve a separately reported last successfully verified head. The SQLite journal uses WAL/FULL transactions. This is process-restart recovery, not a physical power-loss qualification or disk-reserve guarantee.

Producer rotation has separate old/new Ed25519 signatures, an authority-signed revision and the old run's signed witness head. It preserves tenant/system enrollment and starts a new run epoch, matching the existing single-stream verifier. Rotation does not mix keys inside an old bundle. Historical revision verification remains valid as of its enrolled snapshot; the same old bundle is unknown under current revocation, while the rotated epoch verifies. Real workers refuse revoked producers and authorities. Signed revisions have explicit local issue/expiry times; stale trust is incomplete. Historical snapshots never override current revocation. Same-machine keys and witness remain development custody, not enterprise identity or independent endorsement.

The durable bridge stores exact canonical verification/evaluation/governance report bytes, digest and signed commit receipt in SQLite with WAL/FULL synchronization. It acknowledges only after commit. A real child process exited 99 inside an uncommitted write; a new process found no phantom report, committed once, and later reconnect returned an idempotent receipt and verified bytes. Concurrent-client tests verify a single receipt. Changed bytes under an existing run ID conflict; changed evaluations require a new run/version, rather than rewriting evidence. Tenant, role, purpose, byte-size and digest checks precede storage. Readback/reconciliation verifies the stored digest and receipt. Existing EvidenceStore/envelope output remains an in-memory projection; SQLite is the durable report source in importDurableReport.

Report-copy retention is separate from signed source bundles and source-store retention. Admin-only durable holds block report removal; deletion leaves the original commit/digest receipt and a tombstone, refuses resurrection and makes bytes unavailable through the API. It does not attest secure erasure of SQLite pages, WAL, backups or other copies. Commercial managed artifact retention and durable report retention have separate explicit endpoints; holding one is not a claim that every copy everywhere is held. Original public source bundles, signed envelopes and audit receipts are retained.

## Reproduce and stop

Use Node 22.23 or later; no model download or provider call is needed for this phase:

```sh
node scripts/robot-black-box/assurance-execute.mjs .rbb/assurance-new
node scripts/robot-black-box/governance-bind-operational.mjs .rbb/governance-demo .rbb/assurance-new
node --test scripts/test-robot-black-box-operational.mjs
```

The first command requires a fresh output directory and exits after the finite execution. It provisions local keys before multiple clients start. Binding requires a fresh G25 run ID in the target custody directory; do not rebind over signed evidence. For an existing configured root, start the service with a finite budget:

```sh
node scripts/robot-black-box/assurance-worker.mjs .rbb/assurance-new 3
```

The worker exits after three checks; interrupt it with Ctrl-C to stop earlier. Its config.json pins the producer/run/store, interval and synthetic artifacts; no source subscription or motion control occurs. Expired stored trust is reported stale and is not silently renewed. Tick budgets are 1–100 and intervals 20–60,000 ms. Configured continuous checking remains a local service capability, not a hosted monitoring SLA or enterprise scheduler.

For the local console:

```sh
RBB_PORT=4323 node packages/robot-black-box-commercial/src/index.mjs .rbb/governance-operational-commercial .rbb/governance-demo
```

SIGINT/SIGTERM close the server/databases. Private demo credentials remain in the service directory. Exporting /v1/runs/:id/bundle?purpose=governance_evaluation commits the immutable report and returns durable_report. Read its stored bytes with GET /v1/runs/:id/durable-report?purpose=governance_evaluation. Admin POST durable-hold accepts purpose and a boolean enabled; POST delete-durable accepts purpose. Wrong tenant/role/purpose and missing reports are refused. No remote deployment, paid service, live vehicle, recognition, surveillance or hardware source is involved.

The new 40-second stakeholder overview is a separately named captioned silent render; prior videos, including the founder-voice version, remain available. Its measured props hash the executed receipt and durable report. External witness/custody, replication/backup recovery, real hardware and qualified review remain gates.

## Verified delivery

All 36 Robot Black Box tests passed after fixing the SQLite initialization lock race by configuring busy_timeout before WAL setup. ESM syntax/build, AJV validation of 226 governance documents, renderer TypeScript, Python/OpenSSL G25 signatures and git diff --check passed locally. CI includes the new operational suite but was not remotely executed. The local console at http://127.0.0.1:4323 showed 33 runs, no error/overlay, G25 digest/citations and cleared prior evidence on tenant switch. Actual HTTP readback verified its digest; cross-tenant read returned 404, wrong-purpose read 403 and held removal 400.

[Durable GRC bridge result](../../examples/robot-black-box-governance/executed/operational-durable-grc-bridge.json), [service public trust](../../examples/robot-black-box-governance/executed/operational-service-trust.json) and [HTTP/commercial review](../../examples/robot-black-box-governance/executed/operational-commercial-review.json) distinguish the exact stored G25 report from the earlier operational-new handover report. Their digests differ because they are different report bytes. The G25 stored report digest is 3e05aafba7f131a2a4c7508424ae79a80fc2a579ca46f6466f4e238bf39e46a5. Historical check times describe the finite execution rather than current ongoing monitoring. Incomplete/invalid verification retains errors, warnings and completeness flags; missing source event counts cannot be inferred when no trusted expected count/gap exists. No capture-completeness claim is made.

[40-second silent overview](../../media/robot-black-box-demo/out/operational-overview.mp4) has 1,200 frames, 1920×1080 at 30 fps/H.264 and no audio stream. Four decoded chapter samples passed visual inspection. [Render provenance](../../media/robot-black-box-demo/out/operational-provenance.json) binds measured props, package lock and output digest. Render separately with node scripts/render-operational.mjs from the media project. Prior overview and founder-voice outputs were preserved.
