# Governance demonstration

The console separates task success, signed-record integrity, handover authorization and governance. A successful synthetic handover can fail oversight because consent expired or a context source was unauthorized. Each result below links to its signed evidence bundle.

[Watch the 60-second overview](../../media/robot-black-box-demo/out/governance-overview.mp4). Local console: `http://127.0.0.1:4319`; use private local service credentials, then click a run for digests, citations and evidence pointers.

| Run | Governance | First result | Signed evidence |
| --- | --- | --- | --- |
| G0 | pass | GOVERNANCE_CONTROLS_SATISFIED | [bundle](../../examples/robot-black-box-governance/executed/G0/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G0/governance.json) |
| G1 | fail | PURPOSE_DENIED | [bundle](../../examples/robot-black-box-governance/executed/G1/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G1/governance.json) |
| G2 | fail | CONSENT_EXPIRED | [bundle](../../examples/robot-black-box-governance/executed/G2/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G2/governance.json) |
| G3 | fail | GOVERNANCE_APPROVAL_EXPIRED | [bundle](../../examples/robot-black-box-governance/executed/G3/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G3/governance.json) |
| G4 | unknown | CONTEXT_STALE_OR_FUTURE | [bundle](../../examples/robot-black-box-governance/executed/G4/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G4/governance.json) |
| G5 | unknown | CONTEXT_CONFLICT | [bundle](../../examples/robot-black-box-governance/executed/G5/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G5/governance.json) |
| G6 | fail | CONTEXT_ACCESS_DENIED | [bundle](../../examples/robot-black-box-governance/executed/G6/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G6/governance.json) |
| G7 | fail | CONTEXT_VERSION_OR_DIGEST_CHANGED | [bundle](../../examples/robot-black-box-governance/executed/G7/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G7/governance.json) |
| G8 | fail | TWIN_MODEL_MISMATCH | [bundle](../../examples/robot-black-box-governance/executed/G8/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G8/governance.json) |
| G9 | unknown | BIOMETRIC_REVIEW_EVIDENCE_MISSING | [bundle](../../examples/robot-black-box-governance/executed/G9/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G9/governance.json) |
| G10 | fail | LOCAL_DELETION_PROPAGATION_INCOMPLETE | [bundle](../../examples/robot-black-box-governance/executed/G10/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G10/governance.json) |
| G11 | pass | GOVERNANCE_CONTROLS_SATISFIED | [bundle](../../examples/robot-black-box-governance/executed/G11/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G11/governance.json) |
| G12 | pass | GOVERNANCE_CONTROLS_SATISFIED | [bundle](../../examples/robot-black-box-governance/executed/G12/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G12/governance.json) |
| G13 | fail | CONTEXT_PROMOTED_TO_INSTRUCTION | [bundle](../../examples/robot-black-box-governance/executed/G13/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G13/governance.json) |
| G14 | unknown | WORKFLOW_APPROVAL_CHECKPOINT_MISSING | [bundle](../../examples/robot-black-box-governance/executed/G14/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G14/governance.json) |
| G15 | fail | VLA_MODEL_DRIFT | [bundle](../../examples/robot-black-box-governance/executed/G15/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G15/governance.json) |
| G16 | unknown | CONTEXT_PROVIDER_UNAVAILABLE | [bundle](../../examples/robot-black-box-governance/executed/G16/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G16/governance.json) |
| G17 | unknown | TWIN_SENSOR_STALE_OR_FUTURE | [bundle](../../examples/robot-black-box-governance/executed/G17/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G17/governance.json) |
| G18 | unknown | TWIN_LICENSE_MISSING | [bundle](../../examples/robot-black-box-governance/executed/G18/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G18/governance.json) |
| G19 | fail | SENSITIVE_CAPTURE_DENIED | [bundle](../../examples/robot-black-box-governance/executed/G19/manifest.json) · [control result](../../examples/robot-black-box-governance/executed/G19/governance.json) |
| G20 | pass | Real local LangGraph receipt bound to synthetic governance | [bundle](../../examples/robot-black-box-governance/executed/G20/manifest.json) · [SDK receipt](../../examples/robot-black-box-governance/executed/langgraph-execution.json) |

The hostile note is deliberately inert data; it is never sent to a model or executed. Local cache deletion and encrypted managed-copy deletion have separate scopes. Original vault/replay and signed records remain. Vendor deletion acknowledgement in G11 is simulated.

200/200 authored outcomes matched in controlled synthetic trials. This is control-profile validation, not recognition accuracy, safety certification or jurisdiction compliance. [Technical review](GOVERNANCE-REVIEW.md) · [Run/reproduce](GOVERNANCE.md) · [Primary sources](GOVERNANCE-SOURCES.md).
