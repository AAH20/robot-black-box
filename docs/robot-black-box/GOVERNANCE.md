# Agentic governance extension: run and inspect

This extension adds control evidence for VLA/model provenance, OSS/proprietary digital twins, synthetic biometric declarations and retrieved context. It provides read-only oversight. No biometric matching, tracking, surveillance feeds, model inference or robot control is implemented. See [executed review](GOVERNANCE-REVIEW.md) and [stakeholder walkthrough](GOVERNANCE-DEMO.md).

## Contracts and evidence

The strict [evidence schema](../../packages/robot-black-box-governance/src/evidence.schema.json) and [control profile](../../packages/robot-black-box-governance/src/profile.json) are version 1.0.0. Unknown fields and recognition/tracking activation are rejected. The biometric identifier must start `synthetic-`; only synthetic records are accepted. Consent/legal-basis/assessment references are declarations, not legal determinations. `raw_capture:true` is a declaration of a denied request, never captured biometric data.

`src/adapters.mjs` validates vendor-neutral VLA, twin, biometric, context and workflow receipt contracts without credentials or external calls. Status is explicit: `live`, `replay`, `simulated` or `unavailable`. The executed VLA/twin/biometric fixtures are simulated. Live means the identified local operation executed, not that all provider capabilities were validated.

A canonical governance artifact is hash-bound into an existing signed observation event. A separate authority-signed `GOVERNANCE-APPROVAL` grant binds the complete artifact body, profile digest, tenant, run and review scope. Recorder, manifest, checkpoint and local witness formats remain compatible. Offline governance evaluation checks authenticated retained bytes, then cites signed event IDs and JSON pointers. Integrity, handover authorization and governance are separate outcomes. Sensor/model/license/consent truth is not inferred from valid signatures.

## Fixture execution

From GRC_Claw, Node >=22.23:

```bash
npm run build:robot-black-box
npm run test:robot-black-box
npm run test:robot-black-box-governance
node scripts/robot-black-box/governance-execute.mjs .rbb/my-governance 10
node scripts/robot-black-box/governance-verify.mjs .rbb/my-governance/cases/G0 .rbb/my-governance/custody/trust.json .rbb/my-governance/custody/witness/latest-heads.json
```

Choose a new output directory. Execution creates H0–H6 compatibility cases, G0–G19 showcases and 200 trials. It reads only the separate `examples/robot-black-box-governance/vault` directory, requiring a synthetic marker and allowlist. Tenant/role/purpose checks precede note-content reads; symlink notes, path escapes and oversized notes are refused. Markdown links/plugins/frontmatter are not executed. Retrieval here is deterministic allowlisted context selection, not embedding or semantic-search inference. Hostile content is deliberately included as data; there is no claim of a general prompt-injection detector.

## Real local LangGraph

Python 3.14.7 was used in an isolated environment. No LLM is required:

```bash
python3 -m venv .rbb/context-runtime
.rbb/context-runtime/bin/python -m pip install -r scripts/robot-black-box/langgraph-requirements.lock.txt
.rbb/context-runtime/bin/python scripts/robot-black-box/langgraph-demo.py .rbb/my-langgraph
node scripts/robot-black-box/governance-bind-runtime.mjs .rbb/my-governance .rbb/my-langgraph/execution.json
```

The script uses real LangGraph 1.2.11 and SQLite checkpointer 3.1.1. It interrupts before synthetic human review, closes/reopens the saver and graph, verifies restored checkpoint identity, resumes approved and denied cases, and confirms unrelated thread state is empty. It emits report state only; no operational tools. Tracing and socket connections are disabled. The receipt is hash-bound into G20 with live local workflow provenance; other vendor evidence remains simulated. Synthetic approval input does not replace enterprise authority identity.

The requirements files capture installed versions rather than hash-locked wheels; reproducing on other Python/platform versions may require a separate resolved environment. Core Node governance runtime has no new dependencies.

## Cognee probe

```bash
python3 -m venv .rbb/cognee-runtime
.rbb/cognee-runtime/bin/python -m pip install -r scripts/robot-black-box/cognee-requirements.lock.txt
.rbb/cognee-runtime/bin/python scripts/robot-black-box/cognee-demo.py .rbb/my-cognee
```

Cognee 1.5.4 is installed separately. The script isolates storage/log roots, disables dotenv loading, tracing and socket connections, selects unavailable local Ollama providers, and probes real `add`/dataset listing. The first execution, with connection testing enabled, timed out on the LLM probe. The retained script uses documented `COGNEE_SKIP_CONNECTION_TEST=true` to investigate storage-only ingestion. Inspect the execution report for the actual operation result. No paid credentials are supplied, no models downloaded and no graph/semantic-search result is claimed without execution. The 200-case benchmark retains explicitly simulated Cognee graph responses; a successful add would not upgrade those fixtures to live graph retrieval.

## Console, exports and GRC bridge

```bash
RBB_PORT=4319 node packages/robot-black-box-commercial/src/index.mjs .rbb/my-governance-service .rbb/my-governance
node scripts/robot-black-box/governance-commercial-demo.mjs .rbb/my-governance .rbb/my-commercial-checks
```

The commercial execution script requires G20 from the runtime-binding step. Console at `http://127.0.0.1:4319` uses locally generated private bearer credentials in the selected service's `demo-credentials.json`. Run buttons fetch tenant-authorized evidence details with bundle digests, cited events and pointers. `/v1/runs/{id}/bundle?purpose=governance_evaluation` is required for demo-G runs; handover purpose remains required for demo-H runs. The API keeps local roles, independent advisory policy review, cited notes, encrypted managed-copy holds/deletion and audit. Monitoring includes governance exceptions. GRC bridge serializes actual governance report bytes into the existing in-memory evidence store.

Local context-cache deletion removes selected synthetic entries; simulated vendor acknowledgements do not prove external deletion. Managed-copy deletion deletes its encrypted copy/key and retains original public replay, source vault and immutable signed evidence. These are distinct scopes. No enterprise retention or secure-erasure guarantee is made.

## Video and schema checks

With existing locked renderer dependencies:

```bash
node scripts/robot-black-box/governance-schema-check.mjs .rbb/governance-demo
cd media/robot-black-box-demo
npm run typecheck
node scripts/render-governance.mjs
```

The overview props reference this delivery's measured execution. To render another measurement, update `props/governance.json` from its executed reports first. Renderer uses the existing installed browser or `RBB_BROWSER`; FFmpeg/ffprobe required. It encodes exactly 60 seconds, 1,800 frames at 30 fps/1920×1080, captions and zero audio. Five decoded samples must be visually inspected after changes. Original 75/240-second outputs are preserved.

The executed storage-only retry failed on Ladybug's required graph extension installation under a non-writable path outside the isolated workspace. This is retained as `LOCAL_GRAPH_EXTENSION_PATH_BLOCKED`. Local migrations succeeded; add/graph retrieval did not. See the review's actual failure reports. Provisioning a suitable local graph-extension/provider environment is a remaining Cognee gate.

Real local checkpoint deletion can be exercised after the LangGraph demo:

```bash
.rbb/context-runtime/bin/python scripts/robot-black-box/langgraph-deletion-demo.py .rbb/my-langgraph .rbb/my-langgraph-deletion
```

It deletes only `synthetic-approved`, verifies its checkpoint is absent and the denied thread is unchanged. Historical signed evidence and vault remain. The delivered standalone signed deletion receipt is not witness-anchored; it does not prove external deletion or secure erasure.

Latest local runtime extension: [verified Cognee intake/deletion and MuJoCo simulation evidence](LOCAL-RUNTIME-REVIEW.md). G21 retains valid integrity and unknown governance; the original benchmark is unchanged.

Subsequent verified phase: [real persistent Cognee extraction, cited semantic search, restart and deletion-residue audit](SEMANTIC-RUNTIME.md). G22 is valid/unknown; G23 is valid/fail.
