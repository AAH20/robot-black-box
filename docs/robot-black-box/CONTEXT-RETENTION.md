# Owned synthetic context-store retention

The real local execution removed one freshly created, dedicated tenant-a/source store after a signed retention policy, dry inventory and separate signed reviewer approval. Its held sibling and a tenant-b store remained byte-identical before new-process retrieval, which returned their original source digests. This is application-controlled local file removal, not secure physical erasure or vendor deletion certification.

[Executed receipt](../../examples/robot-black-box-governance/executed/context-retention-execution.json), [public trust snapshot](../../examples/robot-black-box-governance/executed/context-retention-trust.json), [witnessed G24 binding](../../examples/robot-black-box-governance/executed/retention-binding.json), and [G24 evaluation](../../examples/robot-black-box-governance/executed/cases/G24/governance.json) carry the measured evidence. G24 has valid integrity; governance remains unknown because physical erasure is not attested. Its retention section reports owned-store removal as pass. The existing intervention benchmark was not expanded or rerun.

Three fresh source stores used real Cognee cognify with the cached local Qwen model, FastEmbed similarity retrieval, local SQLite graph/relational databases and LanceDB vectors. Six provider calls covered three ingests, one soft deletion and two retained-source restarts. Soft deletion removed current chunks but left two relationship-type rows and a historically recoverable source. The stronger purge therefore targets the entire separately owned source store rather than deleting a shared collection.

The purge inventoried 62 files / 901,325 bytes. A worker actually exited with code 99 after atomic detachment; a different worker recovered from the SQLite journal. Supported LanceDB drop_table calls removed all six dedicated tables and subsequent table opens failed. After those processes closed, filesystem APIs removed the approved owned runtime tree. A fresh process verified the runtime and historical manifest paths absent, SQLite read-only opens rejected and vector paths missing. Normal SDK reads were denied before invocation once the store was detached or purged; no post-removal SDK query recreated a database.

Seven actual refusals cover cross-tenant purge, legal hold, wrong purpose, expired review, self review, detached retrieval and purged retrieval. Bounded inventory rejects symbolic links, hard links, unexpected top-level files and stale inventories. Writer leases block purge; cleanup failures remain explicitly incomplete. Focused filesystem fixtures test recovery, asynchronous leases, stale plans, review refusals and unknown cleanup. Separate tests authenticate the executed evidence, exercise commercial export and GRC report attachment, and reject altered receipt bytes.

The demonstration policy uses zero retention time to make this fresh synthetic store immediately eligible. It is not a production retention schedule. Reviewers are separate enrolled keys with different subjects, automatically signed on the same machine; no human approval or enterprise identity assurance is claimed. Keys, control records, original marked synthetic vaults and signed audit evidence remain. The audit receipt itself intentionally retains source-derived evidence. Previous runtime stores, shared collections, OS copies, backups and physical SSD remnants are outside this purge scope.

Reproduce into a new owned directory after the existing isolated runtime/model setup:

```sh
node scripts/robot-black-box/context-retention-execute.mjs .rbb/context-retention-new
node scripts/robot-black-box/governance-bind-retention.mjs .rbb/governance-demo .rbb/context-retention-new
node --test scripts/test-robot-black-box-retention.mjs
```

The first command rejects an existing output unless explicitly resumed from a pre-purge partial attempt with --resume. Binding uses a new G24 run, so do not rebind into a custody directory already containing that run. Preserve original signed bundles. Python sockets are blocked during provider execution; models are cached public weights. See [semantic runtime limitations](SEMANTIC-RUNTIME.md) for model configuration and extraction quality boundaries. Existing videos were preserved; this phase's new evidence is in receipts and the console rather than a newly narrated video.
