import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {context} from '../../packages/robot-black-box-cli/src/index.mjs';
import {localKey,atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {canonical,digest,signed} from '../../packages/robot-black-box-contract/src/index.mjs';
import {readSyntheticVault,PROFILE} from '../../packages/robot-black-box-governance/src/index.mjs';
import {authorizeContext} from '../../packages/robot-black-box-governance/src/context-access.mjs';
import {ContextRetention,RETENTION_POLICY,inventoryFiles} from '../../packages/robot-black-box-governance/src/context-retention.mjs';
const root=resolve(process.argv[2]??'.rbb/context-retention-executed');const resume=process.argv[3]==='--resume';if(existsSync(root)&&!resume)throw Error('OUTPUT_EXISTS');
let manager=new ContextRetention(join(root,'owned'),{allowedBase:resolve('.rbb'),trust:{},create:!resume});const ctx=context(join(root,'custody'));const trust=structuredClone(ctx.trust);trust.reviewers={};const reviewers={};
const actor=(tenant,role)=>({tenant,role,subject:tenant+'-'+role,purpose:PROFILE.purpose});
for(const tenant of ['tenant-a','tenant-b']){const key=localKey(join(root,'reviewer-keys'),'retention-reviewer-'+tenant);reviewers[tenant]=key;trust.reviewers[key.keyId]={public_key:key.public_key,revoked:false,role:'reviewer',tenant,subject:tenant+'-reviewer'};}
manager.trust=trust;atomicWrite(join(root,'retention-trust.json'),canonical(trust));
const initial={schema:'rbb.context.retention.execution.v1',at:new Date().toISOString(),policy:RETENTION_POLICY,sources:[],denials:[],provider_calls:0,scope:'Three fresh dedicated source stores across two synthetic tenants; existing runtime/vault/evidence untouched',limitations:['Same-machine keys and automated demo reviewer signatures; no human or enterprise identity assurance.','File removal is not secure physical erasure, OS/backups/other copies deletion.','Source-vault originals and historical signed evidence intentionally retained.']};
const report=resume?JSON.parse(readFileSync(join(root,'execution.json'),'utf8')):initial;if(resume){if(report.status!=='partial_or_unknown'||report.dry_run)throw Error('RESUME_REQUIRES_PREPURGE_PARTIAL');atomicWrite(join(root,'attempt-1.json'),canonical(report));delete report.error_code;report.status='resuming';}
function review(tenant,source,operator,domain,extra={}){const now=Date.now(),key=reviewers[tenant];return signed({schema:domain==='CONTEXT-RETENTION-POLICY'?'rbb.context.retention.approval.v1':'rbb.context.purge.approval.v1',tenant,source_id:source,operator_subject:operator.subject,reviewer_subject:tenant+'-reviewer',purpose:PROFILE.purpose,policy_digest:digest(canonical(RETENTION_POLICY)),not_before:new Date(now-1000).toISOString(),expires_at:new Date(now+3600000).toISOString(),...extra},key.keyId,key.privateKey,domain);}
function grant(tenant,source){const now=Date.now();return signed({schema:'rbb.context.access.v1',issuer:ctx.authority.keyId,tenant,role:PROFILE.role,purpose:PROFILE.purpose,source_id:source,operations:['ingest','retrieve','delete'],not_before:new Date(now-1000).toISOString(),expires_at:new Date(now+3600000).toISOString()},ctx.authority.keyId,ctx.authority.privateKey,'CONTEXT-ACCESS');}
function access(record,operation){authorizeContext(record.grant,trust,actor(record.tenant,'lab_operator'),{at:new Date().toISOString(),source_id:record.source,operation});}
function sdk(record,mode,content=''){
 access(record,mode==='ingest'?'ingest':mode==='delete'?'delete':'retrieve');
 return manager.withLease(actor(record.tenant,'lab_operator'),record.source,runtime=>{
  report.provider_calls++;atomicWrite(join(root,'progress.json'),canonical({source:record.source,mode,provider_calls:report.provider_calls}));
  const r=spawnSync(resolve('.rbb/cognee-runtime/bin/python'),['scripts/robot-black-box/cognee-semantic.py',runtime,mode],{input:content,encoding:'utf8',timeout:420000,maxBuffer:8*1024*1024});atomicWrite(join(root,'receipts',record.source+'-'+mode+'.log'),(r.stdout??'')+'\n'+(r.stderr??''));const receipt=JSON.parse(readFileSync(join(runtime,mode+'-execution.json'),'utf8'));if(r.status!==0||receipt.status!=='live_success')throw Error('SEMANTIC_EXECUTION_UNAVAILABLE');atomicWrite(join(root,'receipts',record.source+'-'+mode+'.json'),canonical(receipt));return receipt;
 });
}
function probe(record,mode='inventory'){
 access(record,'retrieve');return manager.withLease(actor(record.tenant,'lab_operator'),record.source,runtime=>{const r=spawnSync(resolve('.rbb/cognee-runtime/bin/python'),['scripts/robot-black-box/context-store-probe.py',runtime,mode,record.source_digest],{encoding:'utf8',timeout:30000,maxBuffer:2*1024*1024});if(r.status!==0)throw Error('STORE_PROBE_UNAVAILABLE');return JSON.parse(r.stdout);});
}
function denied(name,fn){let code;try{fn();}catch(e){code=e.code??e.message;}if(!code)throw Error('EXPECTED_DENIAL_MISSING');report.denials.push({case:name,code});}
try{
 for(const [tenant,source]of [['tenant-a','purge-source'],['tenant-a','held-source'],['tenant-b','other-source']]){
  const previous=report.sources.find(r=>r.tenant===tenant&&r.source===source);if(previous){const row=manager.row(actor(tenant,'admin'),source);if(row.state!=='ready'||row.source_digest!==previous.source_digest)throw Error('RESUME_SOURCE_NOT_READY');manager.marker(row,manager.paths(row).active);continue;}
  const record={tenant,source,grant:grant(tenant,source)};access(record,'ingest');const note=readSyntheticVault(resolve('examples/robot-black-box-governance/retention-vault',tenant),actor(tenant,'lab_operator'),{at:new Date().toISOString()}).find(n=>n.id===source);record.source_digest=note.digest;record.path=manager.register(actor(tenant,'admin'),source,note.digest,ctx.producer);record.ingest=sdk(record,'ingest',note.content);manager.activate(actor(tenant,'admin'),source,record.ingest);manager.policy(actor(tenant,'admin'),source,review(tenant,source,actor(tenant,'admin'),'CONTEXT-RETENTION-POLICY'));record.inventory=probe(record);report.sources.push(record);
 }
 const [candidate,held,other]=report.sources;manager.hold(actor('tenant-a','admin'),held.source,true);
 candidate.soft_delete=sdk(candidate,'delete');candidate.after_soft_delete=probe(candidate);if(!candidate.after_soft_delete.historical_source_reachable)throw Error('SOFT_DELETE_HISTORY_NOT_ESTABLISHED');
 const heldBefore=inventoryFiles(held.path),otherBefore=inventoryFiles(other.path);
 const plan=manager.dryRun(actor('tenant-a','admin'),candidate.source);report.dry_run=plan;const approval=review('tenant-a',candidate.source,actor('tenant-a','admin'),'CONTEXT-PURGE-APPROVAL',{plan_digest:digest(canonical(plan))});
 denied('cross_tenant_purge',()=>manager.purge(actor('tenant-b','admin'),candidate.source,approval));
 const heldPlan=manager.dryRun(actor('tenant-a','admin'),held.source);const heldApproval=review('tenant-a',held.source,actor('tenant-a','admin'),'CONTEXT-PURGE-APPROVAL',{plan_digest:digest(canonical(heldPlan))});denied('held_source_purge',()=>manager.purge(actor('tenant-a','admin'),held.source,heldApproval));
 denied('wrong_purpose_purge',()=>manager.purge({...actor('tenant-a','admin'),purpose:'operational_identification'},candidate.source,approval));
 const expired=review('tenant-a',candidate.source,actor('tenant-a','admin'),'CONTEXT-PURGE-APPROVAL',{plan_digest:digest(canonical(plan)),expires_at:new Date(Date.now()-1).toISOString()});denied('expired_review_purge',()=>manager.purge(actor('tenant-a','admin'),candidate.source,expired));
 const self=review('tenant-a',candidate.source,actor('tenant-a','admin'),'CONTEXT-PURGE-APPROVAL',{plan_digest:digest(canonical(plan)),reviewer_subject:'tenant-a-admin'});denied('self_review_purge',()=>manager.purge(actor('tenant-a','admin'),candidate.source,self));
 const request={actor:actor('tenant-a','admin'),source:candidate.source,source_digest:candidate.source_digest,approval};manager.close();
 const worker=(fault=null)=>spawnSync(process.execPath,['scripts/robot-black-box/context-retention-worker.mjs',root],{input:JSON.stringify({...request,fault}),encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024});
 const crashed=worker('after_detach');if(crashed.status!==99)throw Error('EXPECTED_PROCESS_EXIT_MISSING');report.crash=JSON.parse(crashed.stdout);manager=new ContextRetention(join(root,'owned'),{allowedBase:resolve('.rbb'),trust});denied('detached_store_retrieval',()=>sdk(candidate,'restart'));manager.close();
 const resumed=worker();if(resumed.status!==0)throw Error('PURGE_RECOVERY_FAILED: '+resumed.stdout);report.recovery=JSON.parse(resumed.stdout);if(report.crash.pid===report.recovery.pid)throw Error('RECOVERY_PROCESS_NOT_INDEPENDENT');report.purge=report.recovery.result;
 manager=new ContextRetention(join(root,'owned'),{allowedBase:resolve('.rbb'),trust});
 report.held_store_byte_inventory_unchanged=inventoryFiles(held.path).digest===heldBefore.digest;report.other_tenant_byte_inventory_unchanged=inventoryFiles(other.path).digest===otherBefore.digest;if(!report.held_store_byte_inventory_unchanged||!report.other_tenant_byte_inventory_unchanged)throw Error('RETAINED_STORE_CHANGED');
 denied('purged_store_retrieval',()=>sdk(candidate,'restart'));
 const absent=spawnSync(resolve('.rbb/cognee-runtime/bin/python'),['scripts/robot-black-box/context-store-absence.py',join(candidate.path,'runtime')],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024});if(absent.status!==0)throw Error('POST_PURGE_ABSENCE_UNVERIFIED');report.post_purge=JSON.parse(absent.stdout);
 held.restart=sdk(held,'restart');other.restart=sdk(other,'restart');for(const record of [held,other])if(record.restart.retrieval_citations[0].returned_text_digest!==record.source_digest||record.ingest.graph_nodes!==record.restart.graph_nodes||canonical(record.ingest.vector_rows)!==canonical(record.restart.vector_rows))throw Error('RETAINED_SOURCE_NOT_INDEPENDENT');
 report.status='verified_owned_source_store_purged';
}catch(e){report.status='partial_or_unknown';report.error_code=e.code??e.message;}
finally{atomicWrite(join(root,'execution.json'),canonical(report));manager.close();ctx.witness.close();console.log(JSON.stringify({status:report.status,error_code:report.error_code,provider_calls:report.provider_calls,sources:report.sources.map(s=>({tenant:s.tenant,source:s.source,nodes:s.ingest.graph_nodes,edges:s.ingest.graph_edges}))},null,2));}
if(report.status!=='verified_owned_source_store_purged')process.exitCode=3;
