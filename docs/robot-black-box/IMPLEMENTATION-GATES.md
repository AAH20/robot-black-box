# Implementation gates: executed prototype versus future integration

The implementation is a concrete local prototype, not a declaration that every production milestone in the architecture plan is complete.

| Planned gate | Executed capability | Remaining release/integration gate |
| --- | --- | --- |
| M0 contract | versioned strict local envelope, discriminated payload JSON Schema, native validation, canonicalization vectors, immutable synthetic scenario labels | stable portable v1, arbitrary payload/profile compatibility, external domain/security review |
| M1 recorder | SQLite WAL/FULL transactions, signed events/manifest, content artifacts, duplicates, process-exit/restart recovery, budget fault | automatic checkpoint cadence, actual disk reserve/backpressure, multi-stream/reboot continuity, protected signer/rotation |
| M2 verifier | offline independent package, signatures/bytes/sequence/causal checks, witness receipts/latest-head comparisons, Python/OpenSSL second implementation | remote witness/custody, broad cross-language JCS conformance, streaming verifier beyond 64 MiB file limit, qualification/security audit |
| M3 policy/bridge | signed approval scope/config/policy/expiry, pass/fail/unknown, clock/gap checks, actual report bytes in existing GRC evidence/envelope | native LeRobot/Parquet/video importer, real recorded source approval provenance, production durable bridge persistence |
| M4 benchmark/video | seven cases × 50 seeds, raw local bundles/trials/measurements, three declared arms, captioned 75/240-second Remotion output and visual QA | external gold-label review, human reviewer study, representative held-out source variants; vertical composition QA/render |
| M5 simulator/model | synthetic read-only replay, explicit no-model/no-hardware source labeling | NVIDIA/Isaac/GR00T compatible GPU environment and source taps; no simulator/inference performance result |
| M6 lab | documented external safety boundary; no actuation paths | real access/equipment, validated independent safety system, supervised operator/observer, domain-qualified trials |
| M7 commercial | loopback fleet console/API, local role tokens/tenant scope, policy review registry, notes/purpose export, encrypted managed copies/hold/deletion, signed tenant snapshot/restore and audit, exception monitor | arbitrary fleet batch ingestion, enterprise SSO/mTLS, protected remote custody, policy activation/re-evaluation lifecycle, continuous scheduler, private retention/backup/DR guarantees, production security/SLA/support |
| M8 UAV | design only | civilian authorized MAVLink byte parsing/signature/replay adapter; no real flight/control |

ESM JavaScript modules avoid changing the shared TypeScript project-reference graph. Node syntax checks, protocol tests and renderer TypeScript checks are separate. Eight new npm workspaces are registered through existing workspace globs; root scripts/lock additions preserve all pre-existing unrelated contents. No global skill installation, sub-agent delegation, deployment, push, publication or third-party contact occurred.

Core and local service contributions use the repository MIT license. Renderer dependencies retain their separate terms; commercial Remotion usage must satisfy its license. Optional video tooling does not become a recorder/verifier dependency. Commercial value remains integration and recurring evidence operations; basic schema, verification, policy and exports stay open.

## Agentic governance extension

The executed VLA/twin, synthetic biometric and context-governance extension is documented separately: [running guide](GOVERNANCE.md), [measured technical review](GOVERNANCE-REVIEW.md) and [stakeholder demonstration](GOVERNANCE-DEMO.md). Real local vault reads and LangGraph checkpoint execution are distinguished from simulated vendor receipts and failed Cognee runtime probes. Original handover outcomes and videos remain valid within their earlier scope.

## Local operational extension

[Continuous assurance](CONTINUOUS-ASSURANCE.md) executes finite timer checkpoints, signed restart journals, local authority enrollment/rotation/revocation and exact report-byte persistence/readback in SQLite WAL/FULL. These close local prototype portions of M1/M3/M7; protected signers, independent remote custody, multi-stream/reboot continuity, disk reserve, replication/DR and enterprise scheduling remain release gates. No live-source freshness follows from recent replay verification.

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
