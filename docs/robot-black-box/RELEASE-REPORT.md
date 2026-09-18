# Executed local release

Robot Black Box now has eight dependency-free Node ESM workspaces: contract, recorder, verifier, policy, adapters, GRC bridge, CLI and a local commercial demonstration. This delivery records synthetic benign handovers, authenticates signed evidence offline, separates task outcome from authorization, and renders the requested stakeholder and technical videos. It is an uncommitted local prototype based on repository HEAD `f32255eeecac600023aa0fbe52cd28b9f28c4c0b`; unrelated existing edits were preserved.

## Measured execution

The executed workload contains seven showcase cases and 350 benchmark trials (50 seeds per case). Benchmark events: 2,150. Both integrity and authorization match the intervention-authored expected labels in **350/350 trials**. Append p95: **0.765 ms**; verification mean: **3.542 ms**, on Node 22.23.0/macOS arm64/Apple M3. These are a short local workload, not stress, hardware or representative incident-distribution measurements. Expected labels were authored from interventions, not copied from evaluator outputs; external peer review remains pending.

| Case | Intervention | Integrity | Authorization |
| --- | --- | --- | --- |
| H0 | Approved baseline | valid | pass |
| H1 | Expired grant | valid | fail |
| H2 | Configuration binding changed | valid | fail |
| H3 | Telemetry gap and missing execution | valid, incomplete | unknown |
| H4 | Artifact bytes altered after export | invalid | unknown |
| H5 | Producer re-signs rewritten history; original witness conflicts | invalid | unknown |
| H6 | Clock uncertainty intersects expiry | valid | unknown |

The ordinary-log and structured-recording comparison arms conservatively predict authorization unknown for every trial (200/350 matches). They are declared abstention baselines, not independently implemented human investigations or evidence of generalized superiority.

Review [measured summary](../../benchmarks/robot-black-box/v1/results.local.json), [trial CSV](../../benchmarks/robot-black-box/v1/trials.local.csv), [benchmark definition](../../benchmarks/robot-black-box/v1/manifest.json) and [public signed showcase bundles](../../examples/robot-black-box-handover/executed/README.md). Full locally generated custody and execution data reside in `.rbb/local-demo`; private keys and credentials are excluded from public samples.

## Checks executed

- Robot Black Box suite: **15/15 tests passed**, including a child process exiting inside a SQLite transaction, restart rollback, signatures/authority/custody, bounded spool and commercial isolation/retention/HTTP checks.
- Eight workspace entrypoints passed syntax checks. Existing physical-AI assurance tests and evidence build passed.
- AJV accepted **2,193 exported events** across showcase and benchmark runs, and rejected negative vectors.
- Node offline verification accepted H0, including the copied public sample. Independent Python/OpenSSL verification accepted H0 and rejected intentionally altered H4.
- Commercial execution exercised seven Tenant A runs, zero Tenant B visibility, independent policy review, purpose export, cited human notes, encrypted managed-copy hold/release/deletion and a signed tenant-scoped metadata snapshot. Signature/digest validation and read-only restore returned seven runs. Report: `.rbb/commercial-final/execution.json`.
- Refreshed loopback console browser check returned seven rows, no error status or runtime error overlay. Full-page screenshot was visually inspected: [console](../../media/robot-black-box-demo/out/console-fleet.png).
- Renderer clean locked npm install and TypeScript check passed. Linux CI is configured; no remote CI execution is claimed.

Root `npm test` (existing ingest suite) finished **33 passed, 1 failed**. The unchanged `packages/ingest/test/comprehensive.test.ts:143` asserts exactly four framework packs; the current registry returns 39 (`39 !== 4`). This failure is outside the new Robot Black Box code and was left unchanged. No full-repository build or clean root installation is claimed.

## Rendered deliverables

| Video | Duration | Frames | Format |
| --- | --- | --- | --- |
| [Stakeholder](../../media/robot-black-box-demo/out/handover-short.mp4) | exactly 75 s | 2,250 | 1920×1080, 30 fps, H.264 |
| [Technical](../../media/robot-black-box-demo/out/handover-deep-dive.mp4) | exactly 240 s | 7,200 | 1920×1080, 30 fps, H.264 |

Both videos are captioned and silent. They use illustrative diagrams, persistent synthetic-replay labels and measured execution props. Seven pre-encode scene stills and seven decoded final samples per video were inspected for legibility and overlap. ffprobe checked frame count, resolution, rate, codec, zero audio streams and exact container duration; FFmpeg decoded the final samples. Video-only stream-copy remux removed silent AAC padding without re-encoding.

[Render provenance](../../media/robot-black-box-demo/out/render-provenance.json) records input/lock/output digests and render arguments. [Video validation](../../media/robot-black-box-demo/out/video-validation.json) records final probes and samples. Browser: Google Chrome for Testing **144.0.7559.20**, reused from the sibling workspace. System font fallback means cross-machine pixel/encoded-byte identity is not guaranteed. [Source manifest](SOURCE-MANIFEST.json) hashes the delivered source snapshot; it is an unsigned review inventory captured after execution, not a signed release attestation.

## Scope and remaining gates

The implemented trust profile is a strict single-stream local synthetic profile with separate producer/authority/witness keys. All custody is on the same machine. Witness snapshots establish local latestness as supplied; they do not prove sensor truth, external custody or current online freshness. Checkpoints are explicit, not continuously scheduled.

The commercial service uses loopback bearer credentials, local SQLite and a narrowly scoped encrypted managed copy. Deletion leaves original public replay and signed audit records intact. Policy approval is advisory. The GRC bridge imports actual report bytes into the existing in-memory evidence store; it does not add durable production persistence.

LeRobot, Isaac, MAVLink, NVIDIA/GPU inference, real hardware, external key custody, OIDC/mTLS, arbitrary remote fleet ingestion, continuous assurance, automatic rotation/checkpoint scheduling, enterprise disaster recovery and external safety assessment remain integration gates. No physical actions, deployment, publication or trained-model evaluation occurred. See [implementation gates](IMPLEMENTATION-GATES.md), [trust profile](TRUST-PROFILE.md) and [running guide](RUNNING.md).

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
