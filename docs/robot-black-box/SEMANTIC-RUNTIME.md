# Local semantic runtime

The executable local route uses Cognee's built-in `turso` graph provider as a SQLite file, its LanceDB vector provider, llama-cpp-python configured with zero GPU layers, and FastEmbed MiniLM embeddings. No remote Turso service or paid inference API is used. The previous Ladybug workaround remains reproducible for storage-only intake; this route avoids Ladybug extensions entirely.

`context-semantic-execute.mjs` verifies a separately signed `CONTEXT-ACCESS` grant before reading the marked synthetic vault or invoking the SDK. The grant binds tenant, role, purpose, source ID, operations and validity interval. Unknown/revoked authorities, altered signatures, expired grants, wrong tenant and operational identification purpose are denied. Source text and model-generated graph data have no permission effect. Cognee session-memory promotion is disabled with its supported `CACHING=false` setting. The model has no tools; network sockets are blocked during SDK execution and cached weights are used offline.

The SDK runs in isolated single-user mode. The wrapper is an application boundary, not OS access control or Cognee enterprise tenant assurance: a local operator who can execute arbitrary SDK scripts can bypass it. Public receipts carry source/chunk/document identifiers, actual extraction and retrieval outputs, graph/vector counts and separate process IDs. Authoritative source bytes remain the synthetic Markdown note; model-derived relationships are untrusted extraction.

Install the isolated runtime and small public models from the repository root:

```sh
CMAKE_ARGS='-DGGML_METAL=OFF -DGGML_BLAS=ON -DGGML_BLAS_VENDOR=Apple' .rbb/cognee-runtime/bin/python -m pip install --no-cache-dir llama-cpp-python fastembed
.rbb/cognee-runtime/bin/python scripts/robot-black-box/local-model-setup.py
node scripts/robot-black-box/context-semantic-execute.mjs .rbb/cognee-semantic-verified
node scripts/robot-black-box/governance-bind-semantic.mjs
```

Use a fresh execution directory for a new run. Model setup records the official Qwen revision, verifies the GGUF against its published LFS SHA-256, and inventories downloaded embedding files. It requests a quantized 0.5B model below 500 MB and approximately 90 MB of embedding weights; it does not load remote repository code. Installed versions are captured in `scripts/robot-black-box/cognee-requirements.lock.txt`. These are inventories, not a fully hermetic wheel/extension build lock. Actual binary backend capabilities may include Metal; inference explicitly sets zero GPU layers.

The lifecycle executes `add`, `cognify`, embedding-based `CHUNKS` search, a fresh-process graph/vector/retrieval verification, and default soft intake deletion. It measures remaining intake, graph and vector records, raw files and post-delete search separately. A successful API response alone does not establish erasure. Historical signed receipts and source-vault notes are retained.

G22/G23 bindings are generated only after a successful lifecycle receipt and access-grant authentication. G22 combines historical successful semantic retrieval with the real MuJoCo receipt and must remain unknown without a sim-to-real assessment. G23 maps the actually denied tenant access into a failing governance control. The old 200-trial fixture benchmark is unchanged. Robot-model, proprietary twin, biometric and workflow declarations in these new cases remain fixtures; independent custody and legal/hardware validation remain open gates.

Primary implementation references: [Cognee local graph adapter](https://github.com/topoteretes/cognee/blob/main/cognee/infrastructure/databases/graph/turso/adapter.py), [Cognee llama.cpp adapter](https://github.com/topoteretes/cognee/blob/main/cognee/infrastructure/llm/structured_output_framework/litellm_instructor/llm/llama_cpp/adapter.py), [llama-cpp-python](https://github.com/abetlen/llama-cpp-python), [official Qwen GGUF model](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF), [FastEmbed](https://qdrant.github.io/fastembed/), [MiniLM model license](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/blob/main/LICENSE).

## Verified execution

The successful receipt is `examples/robot-black-box-governance/executed/cognee-semantic-execution.json`. Cognee extracted 7 nodes and 10 edges, and retrieved one chunk whose returned text digest exactly matches the original source SHA-256 (`ca673bae5c0143e7e40b497d8394428b708e255454d5d87a0b90c21ea6a40947`). Fresh-process retrieval returned the same chunk/document identifiers and graph/vector counts. Measured add: 1,395.94 ms; cognify: 11,220.50 ms; initial chunk search: 56.23 ms; restart search: 47.66 ms. These are one small synthetic execution, not a throughput or quality benchmark.

Current active vectors before deletion: one source chunk, ten relationship-type rows, one entity-type row, three entity rows, one document row and one summary row. Default soft deletion left zero intake items, graph nodes/edges and chunk-search hits. It retained one raw file and two relationship-type rows containing source-derived descriptions (`robot black box is a node.` and `mujoco is a node.`). Those are retained context, not a complete erasure result.

A separately signed, read-only residue audit (`cognee-deletion-residue-receipt.json`) authenticated the same source grant before reading storage. LanceDB chunk versions 1, 2 and 3 remain. Checking out historical version 2 through a local read handle recovered one source chunk with the original SHA-256, while current chunk rows remained zero. Six physical Lance fragments remained. No restore, vacuum, old-version cleanup, raw-file deletion or secure erasure was performed. The audit is signed by the same-machine producer but is not witness-anchored; public access trust is `semantic-access-trust.json`.

G22's verified bundle is valid/unknown, with only the missing sim-to-real assessment remaining in this control profile. G23 is valid/fail because denied tenant access is mapped into a synthetic governance declaration backed by the real wrapper denial receipt. These are historical source retrieval receipts, not assertions that the deleted source is currently retrievable through normal search. The source note is independently hash-bound as a bundle artifact. Other model/proprietary/biometric/workflow declarations remain synthetic, and profile evaluation clocks remain replay inputs.

The first attempt was interrupted after graph extraction because default session-memory processing tried to generate a much larger update schema and retried incomplete output. The successful run disables that optional path. Native llama.cpp context initialization failed inside the sandbox, while an authorized unsandboxed preflight succeeded with zero GPU layers and operation offload disabled. The SDK lifecycle also ran outside the sandbox with zero GPU layers. The installed binary includes Metal; no pure CPU binary or absence of every GPU operation is attested. There are no paid services or GPU credentials, and SDK Python socket connections are blocked. Transformers is absent, so Cognee reported approximate TikToken chunk sizing for MiniLM; the tiny note fits comfortably and no tokenizer-equivalence claim is made.

Local console: `http://127.0.0.1:4321`, with private credentials in `.rbb/governance-semantic-commercial`. Browser evidence showed G22's digest/citations and cleared them after switching tenants. Existing handover and fixture benchmark scope is unchanged. The stakeholder videos remain captioned silent renders; this phase adds runtime evidence rather than new media.

Owned source-store purge and retention evidence: [context retention](CONTEXT-RETENTION.md).
