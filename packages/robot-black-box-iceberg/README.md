# robot-black-box-iceberg

Open, engine-neutral projection contract from a **valid Robot Black Box
verification report** into rows suitable for an Apache Iceberg v2 table.

The package deliberately does not connect to an object store or catalog. It
defines deterministic rows, a projection manifest and reconciliation checks so
Flink, Spark, Trino or another implementation can be tested against the same
source evidence.

```js
import {projectVerifiedReport, reconcileProjection} from
  '@grc-claw/robot-black-box-iceberg';

const projection = projectVerifiedReport(verificationReport);
const result = reconcileProjection(verificationReport, projection);
```

Each row binds `source_event_id` and `source_event_digest` to the RBB event.
Iceberg snapshot IDs, catalogs and analytical rows are not evidence witnesses
and do not replace the signed bundle. Invalid or non-factual verification
reports are refused rather than projected as trusted facts.

See [the architecture guide](../../docs/robot-black-box/ICEBERG-PROJECTION.md)
and [the open-core boundary](../../OPEN-CORE-BOUNDARY.md).
