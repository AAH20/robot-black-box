# Robot Black Box: runnable local prototype

This release implements a **synthetic benign-handover replay prototype**, signed evidence and an offline verifier, deterministic authorization checks, a GRC_Claw reporting bridge, an optional local reviewer studio, an Iceberg projection contract, and two rendered Remotion videos. It does not operate hardware, perform NVIDIA inference, certify safety or provide enterprise custody.

## Review the executed delivery

- [Executed release report](RELEASE-REPORT.md): measurements, case results and checks.
- [Trust profile and limitations](TRUST-PROFILE.md): what signatures and local witness state establish.
- [Implementation gates](IMPLEMENTATION-GATES.md): complete local capabilities versus remaining integrations.
- [Measured benchmark summary](../../benchmarks/robot-black-box/v1/results.local.json).
- [Stakeholder video, 75 seconds](../../media/robot-black-box-demo/out/handover-short.mp4).
- [Technical video, 240 seconds](../../media/robot-black-box-demo/out/handover-deep-dive.mp4).
- [Video provenance](../../media/robot-black-box-demo/out/render-provenance.json) and [decoded-output checks](../../media/robot-black-box-demo/out/video-validation.json).

Videos are captioned and silent, 1920×1080 at 30 fps, with illustrative diagrams and persistent synthetic-replay/no-hardware labels. The code includes a vertical composition, but only the two requested landscape videos were encoded and validated. Original planning fixtures remain unsigned examples; executed bundles are separately generated with real Ed25519 signatures.

## Exact tested environment

Node `22.23.0`, npm `10.9.8`, Node SQLite `3.51.3`, macOS arm64. Core uses Node built-ins, so it requires no dependency install. `node:sqlite` is experimental in this Node version; the runtime is pinned for this local release. Independent verifier: Python 3 plus OpenSSL `3.6.3`. Video QA/remux: FFmpeg/ffprobe `8.0.1`. Remotion/CLI `4.0.448`, React `19.0.0`, TypeScript `5.8.2`; renderer package-lock fixes transitives. Browser was the existing workspace Chrome Headless Shell (exact executable/version recorded in release artifacts). Linux CI is configured but was not run remotely.

## Bootstrap and execute

From GRC_Claw:

```bash
node scripts/robot-black-box/bootstrap.mjs --bridge
npm run test:robot-black-box
node scripts/robot-black-box/execute.mjs .rbb/my-execution
```

`--bridge` builds the existing evidence and physical-AI assurance packages. If root dependencies are absent, bootstrap calls `npm ci --ignore-scripts`; otherwise it uses present dependencies. A clean **renderer** npm ci was executed here. A clean root npm ci was not performed because the shared existing dependencies and unrelated work were preserved. Root package-lock adds only the eight new dependency-free workspace/link entries without discarding pre-existing changes.

The execution command generates seven showcase cases, 350 benchmark trials (50 seeds each), custody keys, public trust and witness heads, reports, a content-bearing GRC bridge import and execution.json. Choose a new output directory for another measurement run: existing execution/run IDs are deliberately not overwritten. Timings vary; signatures/ingestion/witness timestamps and keys are intentionally not deterministic. Scenario semantics and expected label outcomes are reproducible. There is no trained model or claimed held-out ML evaluation.

Tests include real process termination inside a SQLite transaction, restart rollback, conflicting duplicates, sequence/order mutations, bounded-spool failure, untrusted/revoked signer, separate authority authentication, unavailable artifacts, local witness fork/rollback rejection, expiry/config/gap/clock cases, studio roles/tenant isolation/purpose/citations/holds/deletion, Iceberg projection reconciliation, signed audit chain and authenticated loopback HTTP. Restricted environments must permit loopback port binding for HTTP tests.

## Individual replay and offline verification

```bash
node packages/robot-black-box-cli/src/index.mjs replay --case examples/robot-black-box-handover/baseline.json --out .rbb/one-run --state .rbb/one-custody
node packages/robot-black-box-cli/src/index.mjs verify --bundle .rbb/one-run --trust .rbb/one-custody/trust.json --heads .rbb/one-custody/witness/latest-heads.json --out .rbb/one-run/offline-verification.json
node packages/robot-black-box-cli/src/index.mjs evaluate --bundle .rbb/one-run --trust .rbb/one-custody/trust.json --heads .rbb/one-custody/witness/latest-heads.json --policy .rbb/one-custody/policy.json --out .rbb/one-run/offline-evaluation.json
python3 scripts/robot-black-box/verify-independent.py .rbb/one-run .rbb/one-custody/trust.json .rbb/one-custody/witness/latest-heads.json openssl
```

CLI verify exits 0 for valid retained evidence within scope, 2 invalid, 3 unknown trust. Evaluation exits 0 pass, 2 fail, 3 unknown. Invalid cases deliberately return nonzero. Missing latest-head evidence leaves anchoring unknown even when event signatures are valid. A supplied snapshot establishes only local latestness as of that snapshot, not online freshness.

The verifier package imports only the contract and Node crypto/fs/path. It has no recorder, SQLite, GRC_Claw, network, AI, renderer or private-key dependency. The combined CLI imports replay components too; direct verifier package use does not. Python/OpenSSL provides a second implementation for these ASCII/integer local bundle vectors; it explicitly refuses broader JSON profiles rather than guessing canonicalization.

## Local reviewer studio

```bash
node scripts/robot-black-box/studio-demo.mjs .rbb/local-demo .rbb/my-studio-execution
node packages/robot-black-box-studio/src/index.mjs .rbb/studio .rbb/local-demo
```

Console: `http://127.0.0.1:4318`. Use `RBB_PORT` to select another loopback port. Credentials are generated randomly in the private `demo-credentials.json` inside the selected service directory; copy a chosen tenant/role token into the console password field. Do not publish that file. No credentials appear in video inputs or public sample bundles. The service uses local bearer identity, not enterprise SSO.

The studio reviews runs and exceptions. Its API demonstrates ingestion of the seven pre-generated cases, policy draft/independent approval, cited human notes, purpose-limited export, retention request/hold/managed-copy deletion, and monitoring. The studio demo executes all of these plus a signed tenant-scoped SQLite metadata snapshot and read-only restore/digest check. Invalid evidence is retained as an exception, not upgraded to trusted facts. Tenant B sees no Tenant A runs and cannot export them.

| Endpoint | Body/query | Meaning |
| --- | --- | --- |
| GET /v1/runs; GET /v1/monitor | bearer credential | tenant-scoped review |
| POST /v1/ingest | `{case_id:"H0"}` | import permitted pre-generated local case only; not arbitrary remote fleet/event ingestion |
| POST /v1/policies | `{id,policy}` | draft exact supported policy profile |
| POST /v1/policies/{id}/approve | `{}` | reviewer distinct from author; advisory registry, no controller activation |
| GET /v1/runs/{id}/bundle | `purpose=handover_evaluation` | signed public synthetic records and purpose-controlled managed artifacts |
| POST /v1/runs/{id}/notes | `{note,citations:[event_id]}` | human comment, all citations must resolve to accessible verified evidence |
| POST /v1/runs/{id}/deletion-requests | `{}` | request; a held copy stays held |
| POST /v1/runs/{id}/hold | `{enabled:true|false}` | local managed-copy hold/release |
| POST /v1/runs/{id}/delete-managed | `{}` | delete local encrypted managed copy/key and sign scoped tombstone |

Private data capture is rejected by the recorder profile. Managed-copy encryption uses per-run AES-256-GCM keys and random IVs. Deletion does not erase the original public synthetic replay, signed envelopes, audit, filesystem remnants or external backups. Policy lifecycle, monitoring and storage are demonstrations, not production recurring-assurance guarantees.

## Rebuild the videos

```bash
cd media/robot-black-box-demo
npm ci --ignore-scripts --workspaces=false --no-audit --no-fund
node scripts/build-render-input.mjs ../../.rbb/local-demo/execution.json
npm run typecheck
node scripts/render.mjs stills
node scripts/render.mjs videos
node scripts/verify-videos.mjs
```

Provision a tested Chrome Headless Shell and set `RBB_BROWSER=/absolute/path/to/chrome-headless-shell`; this execution reused the sibling workspace's installed browser. If not supplied/found, Remotion may download a browser, so first-run network access is required. FFmpeg must be on PATH for video-only remux and decoded QA. A stream-copy remux removes Remotion's silent AAC padding without re-encoding video, yielding exact 75/240-second containers.

Scene stills and decoded final samples require human visual review after any layout/data changes; metadata checks alone are insufficient. Props carry executed-report digests, actual case outcomes, metrics, scope and limitations. Fonts use the installed system Arial fallback; cross-machine font/pixel/encoded-byte identity is not guaranteed. The render provenance and source manifest document the local execution. No publishing is performed by these commands.

Optional full schema-engine check after renderer dependencies are installed:

```bash
node scripts/robot-black-box/schema-check.mjs .rbb/local-demo
```

This uses AJV pinned in the renderer dependency lock; cryptographic authentication and policy checks remain separate. Core runtime performs its own strict local-profile validation without AJV.

## Agentic governance extension

The executed VLA/twin, synthetic biometric and context-governance extension is documented separately: [running guide](GOVERNANCE.md), [measured technical review](GOVERNANCE-REVIEW.md) and [stakeholder demonstration](GOVERNANCE-DEMO.md). Real local vault reads and LangGraph checkpoint execution are distinguished from simulated vendor receipts and failed Cognee runtime probes. Original handover outcomes and videos remain valid within their earlier scope.

Latest local runtime extension: [verified Cognee intake/deletion and MuJoCo simulation evidence](LOCAL-RUNTIME-REVIEW.md). G21 retains valid integrity and unknown governance; the original benchmark is unchanged.

Subsequent verified phase: [real persistent Cognee extraction, cited semantic search, restart and deletion-residue audit](SEMANTIC-RUNTIME.md). G22 is valid/unknown; G23 is valid/fail.

Owned source-store purge and retention evidence: [context retention](CONTEXT-RETENTION.md).

Executed bounded checkpoint scheduling, local key lifecycle and durable report storage: [continuous assurance](CONTINUOUS-ASSURANCE.md).

Aircraft recorder comparison and resulting local improvement: [technical comparison](AIRCRAFT-BLACK-BOX-COMPARISON.md), [stakeholder one-page](AIRCRAFT-BLACK-BOX-ONE-PAGE.md), [signed capture-quality diagnostics](CAPTURE-QUALITY.md). The new six-case quality exercise preserves old event contracts/results and does not claim physical capture or aviation qualification.

## Portable investigation milestone

The public synthetic six-case suite now travels with original signed bundles, historical public trust, authority-signed capture profiles and offline verifier/policy modules. Two detached fresh-process reviews reproduced the same reports; the full local regression suite passed 50/50 tests. Transport completeness, cryptographic integrity, authorization and capture quality remain separate; current online trust, source truth, external custody and hardware qualification are not established. See [PORTABLE-INVESTIGATION.md](PORTABLE-INVESTIGATION.md) for runnable commands, intake limits and the required external trust/pin boundary.

## Portable package integrity bootstrap

A standalone reviewer-side Node bootstrap now checks a mandatory externally supplied manifest SHA-256 and bounded file inventory before running included package code from a private verified snapshot. Six fresh-process demonstrations rejected coherent tool/evidence plus manifest rewrites and absent/wrong pins, then recovered from a clean copy. All 61 local tests passed; original 50 are preserved. The demo pin is explicitly same-host-generated, so independent pin distribution, bootstrap authenticity, external custody and enrollment remain open gates. Commands and trust boundaries: [PORTABLE-INVESTIGATION.md](PORTABLE-INVESTIGATION.md#reviewer-side-pin-bootstrap). No publisher seal or new signature scheme was added.

## Local custody and restore milestone

Separately keyed acceptance of the preserved public synthetic package now binds its manifest/inventory/grant digests, declared timestamp, tenant and purpose. Explicit reviewer pinning of custodian identity precedes receipt verification; trusted bootstrap review of restored evidence remains separate. Ten fresh custody processes executed real pre/post-commit crashes, retry, tampered/missing content, receipt/identity denial and clean restore after assembly removal. The full local suite passed 70/70 tests. This is same-host logical immutability/recovery, not independent custody, trusted time, off-host disaster recovery or physical survivability. Commands, public receipts and future HSM/replication/trust-distribution gates: [LOCAL-CUSTODY-RESTORE.md](LOCAL-CUSTODY-RESTORE.md).

## Custody-store loss recovery milestone

A signed bounded SQLite backup now supports restoration after the original custody database/assembly/private worker configs are removed. Recovery requires separate custodian identity and intended backup-receipt pins, checks bytes before opening the snapshot, validates custody and restores the unchanged package before trusted bootstrap review. The executed same-host isolated-copy drill recovered 47 files/six valid signed cases; all 81 local tests passed. It does not demonstrate off-host replication, host/media-loss recovery, independent pin distribution or production RTO/RPO. See [CUSTODY-BACKUP-RECOVERY.md](CUSTODY-BACKUP-RECOVERY.md).

## Signed enrollment during recovery

The recovery-trust entry point now verifies existing authority-signed lifecycle revisions under an external authority pin and reviewer-held revision floor before using custodian enrollment. Executed recovery denied revoked, expired and rollback trust, then restored a fresh successor-key acceptance under revision 4; no historical revocation override or old-backup re-signing was added. All 93 local tests passed. Global latest-revision discovery, independent trust distribution and durable reviewer floor management remain open; low-level key-map recovery does not establish signed current enrollment. See [RECOVERY-TRUST.md](RECOVERY-TRUST.md).

## Durable reviewer floor milestone

Reviewer-owned SQLite state now retains accepted signed revisions/digests across restarts, rejects lower caller minima and same/higher-revision forks, and commits trust before backup recovery. Actual pre/post-commit exits and retained-floor recovery verified six signed cases; all 100 local tests passed. Explicit profile anchors remain externally supplied demonstration trust. Privileged state rollback, lost-state re-enrollment and discovery of unprovided newer revisions still require external monotonic state/trust distribution. See [REVIEWER-STATE.md](REVIEWER-STATE.md).

## Separately retained reviewer checkpoint

A distinct signer now checkpoints exact reviewer anchors, accepted revision/digest and chained checkpoint sequence. Checkpoint-gated recovery requires external signer/profile/latest-sequence-and-digest pins and rejects an actual older valid database replacement, altered/older checkpoints and missing state. A clean retained matching state copy passed verification and restored six signed cases. All 111 local tests passed. Same-host retention is not independent or hardware-backed rollback protection; replacing every retained pin/copy remains outside this profile. No automatic state repair erases history. See [REVIEWER-CHECKPOINT.md](REVIEWER-CHECKPOINT.md).

The consolidated public review now presents eight separate evidence layers, six capture cases and five aircraft investment gaps, with historical/current expiry labels and exact source citations. All 115 local tests passed, with desktop/mobile browser verification and tenant isolation checks. See [CONSOLIDATED-REVIEW.md](CONSOLIDATED-REVIEW.md) for the read-only report command, console and limitations.

Observed passive MuJoCo sample capture now records 100 engine samples across three channels (300 baseline observations) through the existing signed recorder and witness. Dropped, duplicate and delayed-receipt derivatives fail diagnostics; out-of-order source offsets trigger the existing integrity rejection. All 118 local tests passed. Simulation/host clocks and file-mediated ingestion remain explicit, with no physical calibration or live-source claim. See [SIMULATION-CAPTURE.md](SIMULATION-CAPTURE.md).
