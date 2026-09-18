# Local runtime review

This phase replaces a failed Cognee intake probe and one OSS twin declaration with actual local executions. G21 has **valid integrity and unknown governance**. It is excluded from the intervention benchmark; the earlier 200 controlled trials and seven handover cases retain their original scope.

| Component | Executed result | Boundary |
| --- | --- | --- |
| Cognee 1.5.4 | `add` completed; `list_data` returned one synthetic note; stored bytes matched source SHA-256; `datasets.delete_data` left zero listed items | Default soft deletion retained the raw file. No semantic graph extraction/search, backup erasure, or vendor-wide deletion claim. |
| Ladybug 0.19.0 | Official JSON extension installed and loaded under `.rbb/ladybug-supported-home` | Persistent catalog recovery still tries the OS home before a connection setting applies. The registered probe adapter uses a supported in-memory graph, 32 MiB buffer, two threads, and 256 MiB maximum DB size. Relational intake and raw files are isolated on disk. |
| MuJoCo 3.13.0 | Passive synthetic sphere drop, 1,000 steps at 0.002 seconds; final height 0.09963281815747682 m; one contact; near-zero final vertical velocity | No robot actuation, hardware, human sensing, or sim-to-real assessment. Apache-2.0 engine license; scenario XML is local synthetic input. |
| Existing LangGraph execution | Historical checkpoint interruption, restoration and approved/denied resumption evidence remains G20 | Its subsequent local thread deletion receipt does not erase historical signed evidence. |

Cognee uses its documented adapter registration mechanism. No installed SDK files were patched. The adapter applies Ladybug's supported connection `home_directory` setting before loading JSON; OS `HOME` is unchanged. The local probe explicitly disables Cognee backend access control because the custom adapter has no registered per-dataset handler. It is single-user synthetic execution only. Existing vault access checks and commercial tenant/purpose authorization remain in place; this does not prove Cognee multi-user isolation.

Socket connections and dotenv loading are disabled during Cognee execution. Connection tests are skipped for storage-only intake. No locally provisioned LLM/embedding server was available; the local Ollama version probe also aborted during Metal initialization in this environment. `cognify` and semantic `search` remain unexecuted. Installing a new model stack is a remaining provider gate, not an executed retrieval result.

G21 retains the model, proprietary twin, biometric and workflow declarations as synthetic fixtures. The real MuJoCo receipt changes the OSS twin to live with `sim_to_real_assessed: false`. The Cognee semantic context source stays unavailable despite successful intake. The evaluator therefore reports `SIM_TO_REAL_ASSESSMENT_MISSING` and `CONTEXT_PROVIDER_UNAVAILABLE`, with signed event citations. Evaluation time and grants remain synthetic profile inputs; they do not establish current legal approval or sensor freshness.

Public evidence is in [executed](../../examples/robot-black-box-governance/executed): `cases/G21`, `simulation-execution.json`, `cognee-intake-execution.json`, and `local-runtime-binding.json`. Producer, authority and witness keys remain on the same machine. Receipts are producer-bound evidence, not independent attestation.

Reproduce from the repository root:

```sh
.rbb/cognee-runtime/bin/python scripts/robot-black-box/ladybug-extension-setup.py
.rbb/cognee-runtime/bin/python scripts/robot-black-box/cognee-demo.py .rbb/cognee-verified-intake
.rbb/simulation-runtime/bin/python scripts/robot-black-box/simulation-demo.py
node scripts/robot-black-box/governance-bind-local.mjs
node scripts/robot-black-box/governance-schema-check.mjs
node --test scripts/test-robot-black-box.mjs scripts/test-robot-black-box-commercial.mjs scripts/test-robot-black-box-governance.mjs
RBB_PORT=4320 node packages/robot-black-box-commercial/src/index.mjs .rbb/governance-runtime-commercial .rbb/governance-demo
```

Use a fresh intake directory and new run/case identity when repeating execution; immutable run IDs cannot be overwritten. Python dependencies are captured in the Cognee and simulation requirements files under `scripts/robot-black-box`; these are installed-version inventories, not wheel hash locks. Extension installation requires network access once. The commercial console credentials remain private inside `.rbb`.

Implementation references: [Cognee supported adapter registration](https://docs.cognee.ai/setup-configuration/community-maintained/falkordb), [Ladybug connection settings](https://docs.ladybugdb.com/cypher/configuration/), [Ladybug extension installation](https://docs.ladybugdb.com/extensions/), [MuJoCo Python bindings](https://mujoco.readthedocs.io/en/stable/python.html), [MuJoCo license](https://github.com/google-deepmind/mujoco/blob/main/LICENSE).

The stakeholder videos remain the earlier captioned silent renders. This phase adds executable receipts and console evidence; it does not claim new narration or new rendered videos.

Subsequent verified phase: [real persistent Cognee extraction, cited semantic search, restart and deletion-residue audit](SEMANTIC-RUNTIME.md). G22 is valid/unknown; G23 is valid/fail.
