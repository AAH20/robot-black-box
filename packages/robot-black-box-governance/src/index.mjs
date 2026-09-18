import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {canonical,digest,authenticate,parseWire} from '../../robot-black-box-contract/src/index.mjs';
export const SCHEMA=JSON.parse(readFileSync(new URL('./evidence.schema.json',import.meta.url),'utf8'));
export const PROFILE=JSON.parse(readFileSync(new URL('./profile.json',import.meta.url),'utf8'));
export function validate(value,schema=SCHEMA,path='$') {
 const bad=()=>{throw Error('GOVERNANCE_SCHEMA:'+path);};
 if(Object.hasOwn(schema,'const')&&value!==schema.const)bad();
 if(schema.enum&&!schema.enum.includes(value))bad();
 if(schema.type==='object') {if(!value||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)bad();if(schema.required.some(k=>!Object.hasOwn(value,k))||Object.keys(value).some(k=>!Object.hasOwn(schema.properties,k)))bad();for(const [k,s]of Object.entries(schema.properties))validate(value[k],s,path+'.'+k);}
 if(schema.type==='array'){if(!Array.isArray(value)||value.length>schema.maxItems)bad();for(const [i,x]of value.entries())validate(x,schema.items,path+'.'+i);}
 if(schema.type==='boolean'&&typeof value!=='boolean')bad();
 if(schema.type==='string'){if(typeof value!=='string'||value.length<(schema.minLength??0)||value.length>(schema.maxLength??Infinity)||(schema.pattern&&!new RegExp(schema.pattern).test(value))||(schema.format==='date-time'&&(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)||!Number.isFinite(Date.parse(value)))))bad();}
 return value;
}
// Reads only an explicit, marked synthetic vault and manifest allowlist. No plugins/links/network execution.
export function readSyntheticVault(root,actor,{at}) {
 const base=realpathSync(root);const marker=join(base,'.rbb-synthetic-vault.json');if(lstatSync(marker).isSymbolicLink())throw Error('VAULT_SYMLINK');
 const manifest=JSON.parse(readFileSync(marker,'utf8'));if(manifest.synthetic!==true||!['tenant-a','tenant-b'].includes(manifest.tenant)||!Array.isArray(manifest.files))throw Error('SYNTHETIC_VAULT_REQUIRED');
 return manifest.files.map(f=>{
  if(!/^[a-z0-9-]+\.md$/.test(f.path))throw Error('VAULT_PATH');const path=resolve(base,f.path);
  if(!path.startsWith(base+sep)||lstatSync(path).isSymbolicLink()||lstatSync(path).size>65536)throw Error('VAULT_BOUNDARY');
  const allowed=actor.tenant===manifest.tenant&&actor.role===f.role&&actor.purpose===f.purpose;
  // Permission decision precedes reading note content.
  const bytes=allowed?readFileSync(path):null;
  return {id:f.id,provider:'obsidian',tenant:manifest.tenant,role:f.role,purpose:f.purpose,version:f.version,current_version:f.version,digest:bytes?digest(bytes):digest('not-read-denied'),observed_at:at,conflict:false,deleted:false,instruction_like:f.instruction_like,status:'live',decision:allowed?'allowed':'denied',content:bytes?.toString('utf8')??null};
 });
}
export function retrieveContext(sources,actor) {
 return sources.map(s=>({source_id:s.id,source_digest:s.digest,decision:s.deleted?'excluded_deleted':s.tenant===actor.tenant&&s.role===actor.role&&s.purpose===actor.purpose?'allowed':'denied',treatment:'untrusted_data',content_persisted:false}));
}
export function removeLocalContext(cache,ids) {for(const id of ids)cache.delete(id);return {removed:ids.every(id=>!cache.has(id)),remaining:cache.size};}
export function evaluateDocument(document,trust,{run_id,tenant,event_ids=[],bundle_digest=null,anchoring='unknown',completeness='unknown'}={}) {
 const results=[];const add=(status,code,pointer)=>results.push({status,code,event_ids,pointer});
 let validated=false;try{validate(document);validated=true;}catch(err){add('unknown','GOVERNANCE_SCHEMA_UNSUPPORTED',err.message);return finish();}
 const d=document;const now=Date.parse(d.at);const {approval,...body}=d;
 if(d.run_id!==run_id||d.tenant!==tenant)add('fail','GOVERNANCE_RUN_SCOPE','$');
 if(d.purpose!==PROFILE.purpose)add('fail','PURPOSE_DENIED','$.purpose');
 if(anchoring!=='local_current')add('unknown','GOVERNANCE_ANCHOR_UNCERTAIN','$');
 if(completeness!=='complete')add('unknown','GOVERNANCE_RECORD_INCOMPLETE','$');
 try {
  const g=authenticate(approval,trust.authorities,'GOVERNANCE-APPROVAL');const issuer=trust.authorities[approval.authentication.key_id];
  if(g.issuer!==approval.authentication.key_id||!issuer.tenants?.includes(d.tenant)||!issuer.roles?.includes(PROFILE.role))throw Error('AUTHORITY_SCOPE');
  if(g.document_digest!==digest(canonical(body))||g.profile_digest!==digest(canonical(PROFILE))||g.tenant!==tenant||g.run_id!==run_id)add('fail','GOVERNANCE_APPROVAL_BINDING','$.approval');
  if(now<Date.parse(g.not_before)||now>=Date.parse(g.expires_at))add('fail','GOVERNANCE_APPROVAL_EXPIRED','$.approval');
 }catch{add('unknown','GOVERNANCE_AUTHORITY_UNVERIFIABLE','$.approval');}
 if(d.model.status==='unavailable')add('unknown','VLA_PROVENANCE_UNAVAILABLE','$.model');
 if(d.model.model_revision!==d.model.expected_revision)add('fail','VLA_MODEL_DRIFT','$.model.model_revision');
 if(d.model.scope!==PROFILE.scope)add('fail','VLA_SCOPE_DENIED','$.model.scope');
 if(d.model.license_declaration==='missing')add('unknown','MODEL_LICENSE_MISSING','$.model');
 for(const kind of PROFILE.require_twin_kinds)if(!d.twins.some(t=>t.kind===kind))add('unknown','TWIN_SOURCE_MISSING','$.twins');
 for(const [i,t]of d.twins.entries()){
  const p='$.twins.'+i;
  if(t.status==='unavailable')add('unknown','TWIN_PROVENANCE_UNAVAILABLE',p);
  if(t.version!==t.expected_version||t.embodiment!==d.model.embodiment)add('fail','TWIN_MODEL_MISMATCH',p);
  if(!t.sim_to_real_assessed)add('unknown','SIM_TO_REAL_ASSESSMENT_MISSING',p);
  if(t.license_declaration==='missing')add('unknown','TWIN_LICENSE_MISSING',p);
  if(now-Date.parse(t.sensor_time)>PROFILE.max_sensor_age_ms||Date.parse(t.sensor_time)>now)add('unknown','TWIN_SENSOR_STALE_OR_FUTURE',p);
 }
 const b=d.biometric;
 if(b.status==='unavailable')add('unknown','BIOMETRIC_DECLARATION_UNAVAILABLE','$.biometric');
 if(b.purpose!==PROFILE.purpose)add('fail','BIOMETRIC_PURPOSE_DENIED','$.biometric.purpose');
 if(now>=Date.parse(b.consent_expires))add('fail','CONSENT_EXPIRED','$.biometric.consent_expires');
 if(b.assessment_ref==='missing'||b.legal_basis_declaration==='missing'||!b.human_review)add('unknown','BIOMETRIC_REVIEW_EVIDENCE_MISSING','$.biometric');
 if(b.raw_capture)add('fail','SENSITIVE_CAPTURE_DENIED','$.biometric.raw_capture');
 if(now>=Date.parse(b.retention_until))add('fail','BIOMETRIC_RETENTION_EXPIRED','$.biometric.retention_until');
 const sourceIds=d.sources.map(s=>s.id);if(new Set(sourceIds).size!==sourceIds.length)add('fail','CONTEXT_SOURCE_ID_AMBIGUOUS','$.sources');
 for(const provider of PROFILE.required_context_providers)if(!d.sources.some(s=>s.provider===provider))add('unknown','CONTEXT_PROVIDER_MISSING','$.sources');
 const retrieved=new Set();
 for(const [i,r]of d.retrievals.entries()){
  const p='$.retrievals.'+i;const s=d.sources.find(x=>x.id===r.source_id);retrieved.add(r.source_id);
  if(!s){add('unknown','CONTEXT_SOURCE_MISSING',p);continue;}
  const authorized=s.tenant===tenant&&s.role===PROFILE.role&&s.purpose===PROFILE.purpose;
  if(!authorized||r.decision==='denied')add('fail','CONTEXT_ACCESS_DENIED',p);
  if(s.deleted&&r.decision!=='excluded_deleted')add('fail','DELETED_CONTEXT_RETRIEVED',p);
  if(!s.deleted&&r.decision==='excluded_deleted')add('unknown','CONTEXT_DELETION_CONFLICT',p);
  if(r.decision!=='allowed')continue;
  if(r.source_digest!==s.digest||s.version!==s.current_version)add('fail','CONTEXT_VERSION_OR_DIGEST_CHANGED',p);
  if(s.status==='unavailable')add('unknown','CONTEXT_PROVIDER_UNAVAILABLE',p);
  if(now-Date.parse(s.observed_at)>PROFILE.max_context_age_ms||Date.parse(s.observed_at)>now)add('unknown','CONTEXT_STALE_OR_FUTURE',p);
  if(s.conflict)add('unknown','CONTEXT_CONFLICT',p);
  if(r.treatment!=='untrusted_data')add('fail','CONTEXT_PROMOTED_TO_INSTRUCTION',p);
 }
 if(d.sources.some(s=>!retrieved.has(s.id)))add('unknown','CONTEXT_RETRIEVAL_EVIDENCE_MISSING','$.retrievals');
 if(!d.workflow.approval_checkpoint||d.workflow.checkpoint_ref==='missing'||d.workflow.status==='unavailable')add('unknown','WORKFLOW_APPROVAL_CHECKPOINT_MISSING','$.workflow');
 if(d.deletion.requested){
  if(!d.deletion.local_cache_removed||d.deletion.source_ids.some(id=>!d.sources.some(s=>s.id===id&&s.deleted)))add('fail','LOCAL_DELETION_PROPAGATION_INCOMPLETE','$.deletion');
  if(d.deletion.vendor_receipts==='missing')add('unknown','VENDOR_DELETION_UNCONFIRMED','$.deletion');
 }
 if(!results.length)add('pass','GOVERNANCE_CONTROLS_SATISFIED','$');
 return finish();
 function finish(){return {schema:'rbb.governance.evaluation.v1',run_id,bundle_digest,profile_digest:digest(canonical(PROFILE)),trust_digest:digest(canonical(trust)),status:results.some(r=>r.status==='fail')?'fail':results.some(r=>r.status==='unknown')?'unknown':'pass',results,integrations:validated?document.sources.map(s=>({provider:s.provider,status:s.status})):[],limitations:['Control evidence in synthetic fixtures; declarations do not establish legal compliance, recognition accuracy or safety.','No biometric matching, tracking or robot-model inference. Local context LLM receipts cannot grant permissions. Same-machine custody.']};}
}
export function evaluateGovernance(report,trust) {
 const events=report.facts?.filter(e=>e.artifact_refs.some(a=>a.capture_role==='governance_evidence'))??[];
 if(!events.length)return null;
 const refs=events.flatMap(e=>e.artifact_refs.filter(a=>a.capture_role==='governance_evidence'));
 if(report.integrity!=='valid'||refs.length!==1)return uncertain('GOVERNANCE_EVIDENCE_UNUSABLE');
 try {
  const ref=refs[0];const path=join(report.bundle_path,'objects',ref.object_id);if(lstatSync(path).isSymbolicLink())throw Error('SYMLINK');const bytes=readFileSync(path);if(bytes.length!==ref.bytes||digest(bytes)!==ref.digest)throw Error('ARTIFACT_DIGEST');
  const evaluation=evaluateDocument(parseWire(bytes.toString('utf8')),trust,{run_id:report.run_id,tenant:report.tenant_ref,event_ids:events.map(e=>e.event_id),bundle_digest:report.bundle_digest,anchoring:report.anchoring,completeness:report.completeness});
  const retentionRef=report.facts.flatMap(e=>e.artifact_refs).find(a=>a.object_id==='context-retention-receipt');
  if(retentionRef){
   const load=id=>{const refs=report.facts.flatMap(e=>e.artifact_refs).filter(a=>a.object_id===id);if(refs.length!==1)throw Error('RETENTION_ARTIFACT_COUNT');const ref=refs[0],path=join(report.bundle_path,'objects',id);if(lstatSync(path).isSymbolicLink())throw Error('SYMLINK');const data=readFileSync(path);if(data.length!==ref.bytes||digest(data)!==ref.digest)throw Error('RETENTION_ARTIFACT_DIGEST');return parseWire(data.toString('utf8'));};
   const r=load('context-retention-receipt'),t=load('context-retention-trust');const p=r.purge;
   const approval=authenticate(p.approval,t.reviewers,'CONTEXT-PURGE-APPROVAL'),policy=authenticate(p.policy,t.reviewers,'CONTEXT-RETENTION-POLICY');
   const enrollment=t.reviewers[p.approval.authentication.key_id];
   if(r.status!=='verified_owned_source_store_purged'||p.tenant!==report.tenant_ref||p.state!=='purged'||!p.active_path_absent||!p.retired_path_absent||p.cleanup.status!=='verified_tables_dropped'||p.cleanup.remaining_tables!==0||p.cleanup.source_digest!==p.source_digest||r.post_purge.status!=='verified_owned_store_absent'||!r.post_purge.runtime_path_absent||!r.post_purge.historical_manifest_paths_absent||!r.held_store_byte_inventory_unchanged||!r.other_tenant_byte_inventory_unchanged||p.physical_erasure!=='not_attested'||p.plan_digest!==digest(canonical(r.dry_run))||approval.plan_digest!==p.plan_digest||policy.policy_digest!==approval.policy_digest||approval.tenant!==p.tenant||approval.source_id!==p.source_id||approval.purpose!==PROFILE.purpose||enrollment.role!=='reviewer'||enrollment.tenant!==p.tenant||enrollment.subject!==approval.reviewer_subject||approval.operator_subject===approval.reviewer_subject)throw Error('RETENTION_RECEIPT_UNSUPPORTED');
   evaluation.retention={schema:'rbb.context.retention.evaluation.v1',status:'unknown',owned_store_removal:'pass',physical_erasure:'unknown',tenant:p.tenant,source_id:p.source_id,source_digest:p.source_digest,receipt_digest:retentionRef.digest,removed_files:p.removed_files,removed_bytes:p.removed_bytes,reviewer_identity:'automated same-machine demo key',originals:'retained',held_source:'retained and restarted',other_tenant_source:'retained and restarted',event_ids:events.map(e=>e.event_id)};
   evaluation.results.push({status:'unknown',code:'CONTEXT_PHYSICAL_ERASURE_NOT_ATTESTED',event_ids:events.map(e=>e.event_id),pointer:'$.retention.physical_erasure'});if(evaluation.status==='pass')evaluation.status='unknown';
  }
  const operationalRef=report.facts.flatMap(e=>e.artifact_refs).find(a=>a.object_id==='operational-assurance-receipt');
  if(operationalRef){const path=join(report.bundle_path,'objects',operationalRef.object_id);if(lstatSync(path).isSymbolicLink())throw Error('SYMLINK');const data=readFileSync(path);if(data.length!==operationalRef.bytes||digest(data)!==operationalRef.digest)throw Error('OPERATIONAL_DIGEST');const r=parseWire(data.toString());
   if(r.status!=='verified_finite_local_assurance'||r.offline_history.historical!=='valid'||r.offline_history.current_revoked!=='unknown'||r.offline_history.new_epoch!=='valid'||!r.durable_readback.verified_readback||r.freshness.aged.local_verification_freshness!=='stale'||r.freshness.current.online_source_freshness!=='unknown')throw Error('OPERATIONAL_RECEIPT_UNSUPPORTED');
   evaluation.operational={schema:'rbb.operational.evaluation.v1',status:'unknown',receipt_digest:operationalRef.digest,scope:r.scope,worker_processes:r.workers.length,scheduled_checks:r.workers.reduce((n,w)=>n+w.results.length,0),checkpoint_failure_recovery:'measured',rotation_history:r.offline_history,local_verification_freshness:'historical finite execution',online_source_freshness:'unknown',durability:r.durable_readback.receipt.durability,durable_content_digest:r.durable_readback.receipt.content_digest,limitations:r.limitations};
   evaluation.results.push({status:'unknown',code:'ONLINE_SOURCE_FRESHNESS_NOT_OBSERVED',event_ids:events.map(e=>e.event_id),pointer:'$.operational.online_source_freshness'});if(evaluation.status==='pass')evaluation.status='unknown';
  }
  return evaluation;
 }catch{return uncertain('GOVERNANCE_ARTIFACT_UNAVAILABLE_OR_CHANGED');}
 function uncertain(code){return {schema:'rbb.governance.evaluation.v1',run_id:report.run_id,bundle_digest:report.bundle_digest,profile_digest:digest(canonical(PROFILE)),status:'unknown',results:[{status:'unknown',code,event_ids:events.map(e=>e.event_id),pointer:'$'}],limitations:['Unusable evidence cannot establish governance controls.']};}
}
