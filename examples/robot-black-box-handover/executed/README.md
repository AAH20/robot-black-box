# Executed synthetic sample bundles

Real Ed25519 signatures from local development keys; synthetic observations/authority, not hardware evidence. H4 has altered artifact bytes; H5 has a rewritten signed history conflicting with its witness receipt. Those deliberately fail verification. Sample trust/latest heads are supplied demonstration inputs, not independent custody or external endorsement. No private keys included. Regenerate fresh samples with scripts/robot-black-box/execute.mjs; keys/timestamps/digests/timings will change.

From GRC_Claw:

```bash
node packages/robot-black-box-cli/src/index.mjs verify --bundle examples/robot-black-box-handover/executed/H0 --trust examples/robot-black-box-handover/executed/sample-trust.json --heads examples/robot-black-box-handover/executed/sample-latest-heads.json --out .rbb/sample-verification.json
```
