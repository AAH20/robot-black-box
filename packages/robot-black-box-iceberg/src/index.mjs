import contract from './table-contract.json' with {type:'json'};
import {canonical,digest} from '../../robot-black-box-contract/src/index.mjs';

const exactString=(value,name)=>{if(typeof value!=='string'||!value)throw Error('PROJECTION_'+name.toUpperCase());return value;};

export function tableContract(){return structuredClone(contract);}

export function projectVerifiedReport(report){
 if(!report||report.schema!=='rbb.verification.v1')throw Error('PROJECTION_REPORT_SCHEMA');
 if(report.integrity!=='valid')throw Error('PROJECTION_REQUIRES_VALID_INTEGRITY');
 if(!Array.isArray(report.facts)||report.facts.length!==report.event_count)throw Error('PROJECTION_REQUIRES_COMPLETE_FACT_SET');
 exactString(report.bundle_digest,'bundle_digest');
 const rows=report.facts.map(event=>({
  projection_schema:'rbb.iceberg.event-projection.v1',
  source_event_id:exactString(event.event_id,'event_id'),
  source_event_digest:exactString(event.authentication?.event_digest,'event_digest'),
  source_bundle_digest:report.bundle_digest,
  tenant_id:exactString(event.tenant_ref,'tenant'),
  purpose_id:exactString(event.privacy?.purpose_id,'purpose'),
  system_id:exactString(event.system_id,'system'),
  run_id:exactString(event.run_id,'run'),
  stream_id:exactString(event.stream_id,'stream'),
  sequence:event.sequence,
  event_type:exactString(event.event_type,'event_type'),
  event_time:event.observed_at,
  ingestion_time:exactString(event.received_at,'received_at'),
  monotonic_ns:exactString(event.monotonic_ns,'monotonic'),
  clock_status:exactString(event.clock?.status,'clock_status'),
  clock_uncertainty_ms:event.clock?.max_uncertainty_ms??null,
  classification:exactString(event.privacy?.classification,'classification'),
  retention_policy_id:exactString(event.privacy?.retention_policy_id,'retention'),
  producer_id:exactString(event.producer_id,'producer'),
  boot_id:exactString(event.boot_id,'boot'),
  config_digest:exactString(event.config_digest,'config_digest'),
  policy_digest:exactString(event.policy_digest,'policy_digest'),
  source_offsets_json:canonical(event.provenance?.source_offsets??[]),
  causal_refs_json:canonical(event.causal_refs),
  payload_digest:digest(canonical(event.payload)),
  artifact_count:event.artifact_refs.length
 }));
 const rowBytes=rows.map(canonical).join('\n')+(rows.length?'\n':'');
 return {contract:contract.contract,namespace:contract.namespace,table:contract.table,format_version:contract.format_version,source:{verification_schema:report.schema,bundle_digest:report.bundle_digest,trust_digest:report.trust_digest,latest_heads_digest:report.latest_heads_digest??null,run_id:report.run_id,tenant_id:report.tenant_ref},row_count:rows.length,rows_digest:digest(rowBytes),rows,boundary:contract.boundary};
}

export function reconcileProjection(report,projection){
 const errors=[];
 if(!projection||projection.contract!==contract.contract)errors.push('CONTRACT');
 const expected=projectVerifiedReport(report);
 if(projection?.row_count!==expected.row_count)errors.push('ROW_COUNT');
 if(projection?.rows_digest!==expected.rows_digest)errors.push('ROWS_DIGEST');
 const rows=Array.isArray(projection?.rows)?projection.rows:[];
 const actualBytes=rows.map(canonical).join('\n')+(rows.length?'\n':'');
 const actualDigest=digest(actualBytes);
 if(projection?.rows_digest!==actualDigest)errors.push('ROW_CONTENT_DIGEST');
 const ids=new Set();
 for(const row of rows){
  const key=row?.tenant_id+'\0'+row?.run_id+'\0'+row?.source_event_id;
  if(ids.has(key))errors.push('DUPLICATE_SOURCE_EVENT');
  ids.add(key);
 }
 return {schema:'rbb.iceberg.reconciliation.v1',status:errors.length?'fail':'pass',errors:[...new Set(errors)],source_bundle_digest:report.bundle_digest,row_count:rows.length,rows_digest:actualDigest,boundary:contract.boundary};
}
