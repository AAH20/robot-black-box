# Aircraft black boxes and Robot Black Box — stakeholder comparison

18 September 2026. Robot Black Box is an inspectable software evidence layer for AI-agent operations. Aircraft FDR/CVR systems preserve flight parameters and cockpit context in qualified, installed recorder systems. Their core purpose is investigation; the project's separate policy evaluator is an additional software function. [NTSB recorder overview](https://www.ntsb.gov/news/Pages/cvr_fdr.aspx).

| Question | Aircraft FDR/CVR | Delivered project |
| --- | --- | --- |
| What is recorded? | Flight/system parameters and cockpit audio | Synthetic observations, proposals, approvals, execution, gaps and artifacts; actual local context/workflow receipts |
| Can the stored data be investigated? | Specialist recovery/readout and independent investigation | Offline signed-bundle readers, event citations and tenant/purpose console; custody remains one machine |
| Does it survive a crash/fire/water? | Protected memory is subject to physical qualification | Not demonstrated; laptop/SQLite/file recovery is software fault recovery, not crash-survivable hardware |
| Is capture calibrated and prescribed? | Applicable parameter performance and installation specifications | Declared channels/time/units and new quality diagnostics; real calibration, sensor completeness and online freshness unknown |
| What is persistent? | Applicable airborne retention/installation behavior | Signed source bundles; local durable report bytes with commit acknowledgement and restart readback |
| Can it authorize/control the vehicle? | The recorder function preserves evidence | Separate grant/governance checks assess supplied authority; this prototype has no motion-control path |
| Is it aviation-approved? | Equipment performance and aircraft installation approvals are separate | No TSO/ETSO, approved installation, crash qualification or certification claim |

Physical and approval facts: [ATSB recorder crashworthiness](https://www.atsb.gov.au/sites/default/files/media/4793913/Black%20Box%20Flight%20Recorders%20Fact%20Sheet.pdf), [EASA FDR specifications](https://www.easa.europa.eu/en/document-library/easy-access-rules/online-publications/easy-access-rules-air-operations?erules-id=ERULES-1963177438-12701), [FAA TSO explanation](https://www.faa.gov/aircraft/air_cert/design_approvals/tso). This table does not assume every aircraft recorder has cloud replication, encryption or identical channel/retention rules.

Executed scope includes 350 authored handover trials and 200 governance trials, actual local LangGraph and Cognee/Qwen/MiniLM processing of synthetic sources, a passive MuJoCo scenario, scoped context purge with crash recovery, local key rotation/revocation, finite scheduled assurance and durable SQLite GRC reports. GR00T robot inference, proprietary twins, genuine biometric matching, real aircraft/robot hardware and independent external custody remain gates. The surrounding GRC_Claw platform has mixed library/reference/demo maturity, not blanket production operating-effectiveness evidence.

The new improvement separates capture quality from cryptographic integrity. All six fresh diagnostic bundles had valid signatures; four known channel/unit/time/cadence defects failed diagnostics, while baseline and uncertain-clock cases remained unknown. A new process reproduced all six reports. Unknown sampling, calibration and live freshness cannot become pass merely because hashes verify. [Execution and recovery](../../examples/robot-black-box-capture-quality/executed/execution.json).

The next investment order is source-aware software/interoperability and disk/recovery tests; independently protected custody and escrow; calibrated passive lab hardware; then application-specific qualification with qualified partners. None can be replaced with a compliance score. Commercial value lies in supported connectors and recurring custody, retention, restoration and investigation operations around open, verifiable contracts.

[Full technical comparison, architecture and roadmap](AIRCRAFT-BLACK-BOX-COMPARISON.md) · [Runnable capture-quality diagnostics](CAPTURE-QUALITY.md). Existing benchmarks/videos and signed records are preserved; no fabricated aircraft hardware footage was added.
