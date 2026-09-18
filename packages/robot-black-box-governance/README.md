# Robot Black Box governance extension

Dependency-free read-only assurance of VLA/model and digital-twin provenance, synthetic biometric declarations and retrieved context boundaries. `src/evidence.schema.json` is the strict versioned wire-artifact schema; `src/profile.json` pins deterministic control requirements. `src/adapters.mjs` exposes vendor-neutral validated intake functions. No model inference, biometric matching, tracking or controller commands are implemented.

Governance artifacts are SHA-256-bound into existing Ed25519-signed handover events/manifests/checkpoints. Separate signed human-oversight grants bind the full artifact body, run, tenant and control profile. Evaluations cite event IDs and artifact pointers; pass/fail/unknown is separate from task success and handover authorization. Receipt intake does not authenticate an external vendor or prove declarations true.

See [running instructions](../../docs/robot-black-box/GOVERNANCE.md) and [executed review](../../docs/robot-black-box/GOVERNANCE-REVIEW.md).
