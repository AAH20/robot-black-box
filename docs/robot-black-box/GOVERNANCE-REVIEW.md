# Executed governance review

The added governance package records VLA/model/config/embodiment provenance, OSS/proprietary twin source/version/license/scenario/sensor declarations, synthetic biometric purpose/consent/assessment/retention declarations, and source-authorized context/workflow evidence. It extends the signed local prototype without changing the existing event contract. All biometric identifiers and identity records are synthetic; no recognition, tracking or operational surveillance is implemented.

## Execution evidence

**200/200 expected governance outcomes matched**, across 20 intervention-authored cases × 10 seeds. All 200 bundles retained valid integrity. Record/export/verify/evaluate p95 was **46.75 ms** in this short workload on Node 22.23.0/macOS arm64. This interval includes local SQLite, checkpoint/export and governance evaluation; it is not the earlier append-only timing or a hardware benchmark. See [measured results](../../benchmarks/robot-black-box/governance-v1/results.local.json) and [all trial measurements](../../benchmarks/robot-black-box/governance-v1/trials.local.csv). No model was trained or evaluated for recognition accuracy; expected labels were defined independently of evaluator outputs. External peer review remains pending.

| Integration | Executed state and evidence |
| --- | --- |
| Obsidian-compatible vault | Real reads of two allowlisted synthetic Markdown files; access decision precedes content read. Obsidian app/API was not invoked. |
| LangGraph | Real SDK 1.2.11 with SQLite saver 3.1.1: pause, reopen database/graph, verify checkpoint, resume approval/denial, separate thread state. [SDK receipt](../../examples/robot-black-box-governance/executed/langgraph-execution.json); signed G20 bundle binds this actual receipt. |
| Cognee | SDK 1.5.4 installed in a separate Python 3.14.7 environment. Initial add probe timed out testing unavailable local LLM. Storage-only retry skipped connection testing, ran migrations, then failed when Ladybug required an extension under a non-writable path outside the isolated workspace. No successful add/cognify/search claimed. [Provider probe](../../examples/robot-black-box-governance/executed/cognee-provider-probe.json), [storage probe](../../examples/robot-black-box-governance/executed/cognee-storage-probe.json). Graph responses/deletion acknowledgement in benchmark remain simulated. |
| GR00T-style VLA | Simulated metadata receipt, no model weights or inference. Hashes identify synthetic declarations, not loaded weights. |
| OSS/proprietary twins | Simulated vendor-neutral provenance and scenario receipts, no physics/digital-twin runtime; proprietary vendor unspecified. |
| Biometric subsystem | Synthetic pseudonymous declarations only. No real faces, templates, identities, matching or tracking. Legal-basis/consent records are assertions for review, not jurisdiction compliance. |

The 200-case benchmark retains its original historical SDK-absent fixture provenance. Installing/executing LangGraph later adds G20 separately; it does not relabel the benchmark as live. `live` on local vault reads and G20 means that specific operation executed; it does not assert enterprise integration.

## Verification

- Governance suite **6/6 passed**: twenty-case gold matrix, strict privacy/recognition boundary vectors, denied reads and symlink rejection, authority/artifact uncertainty, cache deletion, commercial tenant/purpose/citation/monitoring boundaries.
- Prior handover/commercial suite **15/15 passed** after integration. Existing root ingest failure described in the original release report remains unrelated and unchanged.
- AJV and runtime schema validation accepted **221 governance artifacts** (20 showcases + 200 trials + G20), with negative-vector rejection. Entry-point syntax and renderer TypeScript checks passed.
- Real LangGraph execution validated two approval decisions and persistence after saver/graph reconstruction, with tracing/socket connections disabled. Approval inputs and oversight grants/evaluation clocks are synthetic, including G20; the actual SDK receipt establishes local workflow transitions, not current enterprise authorization. No real enterprise reviewer identity was authenticated. A subsequent real `SqliteSaver.delete_thread` execution removed the approved synthetic thread and preserved the denied thread unchanged. [Signed deletion receipt](../../examples/robot-black-box-governance/executed/langgraph-deletion-receipt.json) is standalone and not witness-anchored; G20 retains historical transition evidence, not proof of a presently retained checkpoint.
- Commercial governance demonstration ingested **21 Tenant A governance runs**, exposed **zero** to Tenant B, denied wrong export purpose, stored a cited human note, enforced hold before deletion, and deleted the scoped encrypted managed copy/key. [Execution report](../../examples/robot-black-box-governance/executed/commercial-execution.json). GRC bridge imported actual governance report bytes; durability remains in-memory.
- Console browser returned **28 rows** (seven handover plus 21 governance), no error status/overlay, and evidence-detail interaction resolved bundle digest and event citations. Screenshot and evidence panel were inspected. Switching to Tenant B cleared the prior evidence panel and exposed no Tenant A run. Console currently uses loopback port 4319 with private local credentials.
- [60-second overview](../../media/robot-black-box-demo/out/governance-overview.mp4): exact 60 s, 1,800 frames, 1920×1080/30 fps/H.264, silent captions. Five decoded final chapter samples passed visual inspection. [Provenance](../../media/robot-black-box-demo/out/governance-provenance.json). Earlier 75/240-second outputs retained.

## Peer-review focus

Review [strict artifact schema](../../packages/robot-black-box-governance/src/evidence.schema.json), [pinned profile](../../packages/robot-black-box-governance/src/profile.json), [receipt boundaries](../../packages/robot-black-box-governance/src/adapters.mjs), [offline evaluator](../../packages/robot-black-box-governance/src/index.mjs), [authored interventions](../../packages/robot-black-box-governance/src/fixtures.mjs) and public signed case bundles. Each result cites an authenticated observation event and JSON pointer inside its hash-bound artifact. Verify G0/G20 independently, then inspect G2 expired consent, G6 denied source access, G8 twin mismatch, G10 incomplete deletion, and G13 attempted instruction promotion.

Hash/authority/custody authenticate local records; they do not prove external declarations true. Vendor intake validators are not vendor signature authenticators. Benchmark evaluation clocks and source-read timestamps are synthetic replay timestamps; they do not prove online freshness. Version/freshness drift compares supplied assertions within the control profile, not a continuously polled deployment inventory. Hostile content remains inert because this adapter never executes it; there is no generalized LLM injection-defense claim. Deletion acknowledgements require actual vendor evidence before any live propagation claim.

Missing legal/biometric assessment evidence is unknown; known denied purpose, expired consent, unauthorized retrieval, changed binding or sensitive-capture request fails. A fixture-backed pass means the specified synthetic control profile is satisfied. It is not permission to deploy surveillance or a compliance/safety certification.

Remaining gates include external custody, enterprise identity, live authorized vendor/provider data, jurisdiction-specific review, real model/simulator validation, external deletion receipts, continuous assurance and production retention. Local work remains uncommitted; no deployment, publication or push occurred. See [running guide](GOVERNANCE.md).

Latest local runtime extension: [verified Cognee intake/deletion and MuJoCo simulation evidence](LOCAL-RUNTIME-REVIEW.md). G21 retains valid integrity and unknown governance; the original benchmark is unchanged.

Subsequent verified phase: [real persistent Cognee extraction, cited semantic search, restart and deletion-residue audit](SEMANTIC-RUNTIME.md). G22 is valid/unknown; G23 is valid/fail.
