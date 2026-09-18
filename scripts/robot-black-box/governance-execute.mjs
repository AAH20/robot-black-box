import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {context,replay} from '../../packages/robot-black-box-cli/src/index.mjs';
import {Recorder,atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {syntheticHandover} from '../../packages/robot-black-box-adapters/src/index.mjs';
import {canonical,digest,signed} from '../../packages/robot-black-box-contract/src/index.mjs';
import {verifyBundle} from '../../packages/robot-black-box-verifier/src/index.mjs';
import {evaluate,DEFAULT_POLICY} from '../../packages/robot-black-box-policy/src/index.mjs';
import {evaluateGovernance,PROFILE} from '../../packages/robot-black-box-governance/src/index.mjs';
import {fixture,CASES} from '../../packages/robot-black-box-governance/src/fixtures.mjs';
const repo=resolve(fileURLToPath(new URL('../..',import.meta.url)));
export function governanceReplay(ctx,{case_id,seed=0,out,run_id,runtime=null,simulation=null,contextReceipt=null,semantic=null,semanticControl=null,semanticSource=null,retention=null,retentionTrust=null,operational=null}) {
 const document=fixture({case_id:runtime||simulation||contextReceipt||semantic||retention||operational?'G0':case_id,seed,run_id,authority:ctx.authority,vault:join(repo,'examples/robot-black-box-governance/vault')});
 if(runtime){
  document.case_id=case_id;const s=document.sources.find(s=>s.provider==='langgraph');s.status='live';s.digest=digest(canonical(runtime));s.version=runtime.langgraph;s.current_version=runtime.langgraph;
  const trial=runtime.trials.find(t=>t.case==='approved');if(!trial?.restored_checkpoint||!trial.paused_before_approval||!trial.report_emitted)throw Error('LANGGRAPH_RECEIPT_UNSUPPORTED');
  document.workflow={provider:'langgraph',graph_revision:runtime.graph_revision,thread_ref:trial.thread_ref,checkpoint_ref:trial.checkpoint_ref,approval_checkpoint:true,status:'live'};document.retrievals.find(r=>r.source_id===s.id).source_digest=s.digest;
  const {approval,...body}=document;const {authentication,...grant}=approval;grant.document_digest=digest(canonical(body));document.approval=signed(grant,ctx.authority.keyId,ctx.authority.privateKey,'GOVERNANCE-APPROVAL');
 }
 if(simulation||contextReceipt||semantic||retention||operational){
  document.case_id=case_id;
  if(simulation){
   if(simulation.engine!=='MuJoCo'||simulation.status!=='live'||simulation.sim_to_real_assessed!==false)throw Error('SIMULATION_RECEIPT_UNSUPPORTED');
   const twin=document.twins.find(t=>t.kind==='oss');Object.assign(twin,{source:'MuJoCo passive synthetic sphere drop',license_declaration:simulation.license,version:simulation.version,expected_version:simulation.version,asset_digest:simulation.scenario_digest,scenario_digest:simulation.scenario_digest,sim_to_real_assessed:false,status:'live'});
  }
  if(contextReceipt){const s=document.sources.find(s=>s.provider==='cognee');s.status='unavailable';s.digest=digest(canonical(contextReceipt));s.version=contextReceipt.version;s.current_version=contextReceipt.version;document.retrievals.find(r=>r.source_id===s.id).source_digest=s.digest;}
  if(semantic){
   if(semantic.status!=='live_success'||!semantic.persistence_verified||semantic.ingest?.cognify!=='live_success'||!semantic.restart?.search_count)throw Error('SEMANTIC_RECEIPT_UNSUPPORTED');
   const s=document.sources.find(s=>s.provider==='cognee');s.status='replay';s.digest=digest(canonical(semantic));s.version='cognee-'+semantic.ingest.cognee+'-executed';s.current_version=s.version;document.retrievals.find(r=>r.source_id===s.id).source_digest=s.digest;
   if(semanticControl==='denied_tenant'){if(!semantic.decisions.some(d=>d.case==='wrong_tenant'&&d.authorized===false&&d.provider_invoked===false))throw Error('SEMANTIC_DENIAL_NOT_EXECUTED');s.tenant='tenant-b';document.retrievals.find(r=>r.source_id===s.id).decision='denied';}
  }
  const {approval,...body}=document;const {authentication,...grant}=approval;grant.document_digest=digest(canonical(body));document.approval=signed(grant,ctx.authority.keyId,ctx.authority.privateKey,'GOVERNANCE-APPROVAL');
 }
 const source=syntheticHandover({case_id:'H0',seed,run_id,authority:ctx.authority,producer_id:ctx.producer.keyId});
 const bytes=Buffer.from(canonical(document));source.objects['governance-evidence']=bytes;if(runtime)source.objects['langgraph-receipt']=Buffer.from(canonical(runtime));
 const observation=source.events.find(e=>e.event_type==='observation.recorded');observation.artifact_refs.push({object_id:'governance-evidence',algorithm:'sha256',digest:digest(bytes),bytes:bytes.length,media_type:'application/json',capture_role:'governance_evidence',availability:'available'});
 if(runtime){const r=source.objects['langgraph-receipt'];observation.artifact_refs.push({object_id:'langgraph-receipt',algorithm:'sha256',digest:digest(r),bytes:r.length,media_type:'application/json',capture_role:'runtime_execution_receipt',availability:'available'});}
 for(const [id,receipt]of [['simulation-receipt',simulation],['cognee-storage-receipt',contextReceipt],['cognee-semantic-receipt',semantic],['context-retention-receipt',retention],['context-retention-trust',retentionTrust],['operational-assurance-receipt',operational]])if(receipt){const r=Buffer.from(canonical(receipt));source.objects[id]=r;observation.artifact_refs.push({object_id:id,algorithm:'sha256',digest:digest(r),bytes:r.length,media_type:'application/json',capture_role:'runtime_execution_receipt',availability:'available'});}
 if(semanticSource!==null){const r=Buffer.from(semanticSource);if(!semantic||digest(r)!==semantic.ingest.source_digest)throw Error('SEMANTIC_SOURCE_BINDING_CHANGED');source.objects['semantic-source-note']=r;observation.artifact_refs.push({object_id:'semantic-source-note',algorithm:'sha256',digest:digest(r),bytes:r.length,media_type:'text/markdown',capture_role:'synthetic_context_source',availability:'available'});}
 observation.provenance.adapter_name='governance-read-only-fixture';observation.provenance.source_digest=digest(bytes);
 const recorder=new Recorder({path:join(ctx.base,'producer-spool/events.sqlite'),key:ctx.producer,run_id,witness:ctx.witness});
 const start=performance.now();try{if(recorder.list().length)throw Error('RUN_EXISTS');for(const e of source.events)recorder.append(e);recorder.checkpoint();recorder.export(out,source.objects);}finally{recorder.close();}
 const report=verifyBundle(out,ctx.trust,{latestHeads:ctx.witness.snapshot()});const governance=evaluateGovernance(report,ctx.trust);const elapsed_ms=performance.now()-start;const {facts,...verification}=report;
 atomicWrite(join(out,'verification.json'),canonical(verification));atomicWrite(join(out,'evaluation.json'),canonical(evaluate(report,DEFAULT_POLICY,ctx.trust)));atomicWrite(join(out,'governance.json'),canonical(governance));
 return {case_id,seed,run_id,bundle_digest:report.bundle_digest,integrity:report.integrity,governance:governance.status,expected:retention||operational?'unknown':semanticControl==='denied_tenant'?'fail':simulation||contextReceipt?'unknown':semantic||runtime?'pass':CASES.find(c=>c.id===case_id).gold,results:governance.results,elapsed_ms};
}
export function execute(out,seeds=10){
 out=resolve(out);if(existsSync(join(out,'execution.json')))throw Error('OUTPUT_EXISTS');const ctx=context(join(out,'custody'));const start=performance.now();
 try {
  for(let i=0;i<7;i++)replay(ctx,{case_id:'H'+i,out:join(out,'cases','H'+i),run_id:'demo-H'+i});
  const showcase=CASES.map(c=>governanceReplay(ctx,{case_id:c.id,out:join(out,'cases',c.id),run_id:'demo-'+c.id}));
  const trials=[];for(let seed=0;seed<seeds;seed++)for(const c of CASES)trials.push(governanceReplay(ctx,{case_id:c.id,seed,out:join(out,'benchmark',c.id+'-'+seed),run_id:'governance-'+c.id+'-'+seed}));
  const times=trials.map(t=>t.elapsed_ms).sort((a,b)=>a-b);const summary={schema:'rbb.governance.execution.v1',value_status:'measured_synthetic_controls',out,profile_version:'1.0.0',seeds_per_case:seeds,trials:trials.length,integrity_valid:trials.filter(t=>t.integrity==='valid').length,expected_matches:trials.filter(t=>t.governance===t.expected).length,record_export_verify_evaluate_p95_ms:times[Math.floor(times.length*.95)],elapsed_ms:performance.now()-start,node:process.version,integrations:{obsidian:'live local synthetic Markdown filesystem read; Obsidian app not invoked',cognee:'simulated fixture; SDK absent; no add/cognify/search calls',langgraph:'simulated workflow checkpoint fixture; SDK absent',gr00t:'simulated provenance fixture; no weights loaded/inference',twins:'simulated OSS/proprietary declarations; no physics runtime',biometric:'synthetic pseudonymous declarations; no matching/tracking'},showcase,limitations:['No legal certification or live surveillance/model performance measurement.','Fixture acknowledgement is not vendor deletion proof; source vault and signed evidence retained.','Local keys/witness same machine; gold interventions authored before evaluator.']};
  atomicWrite(join(out,'custody/witness/latest-heads.json'),canonical(ctx.witness.snapshot()));atomicWrite(join(out,'trials.json'),canonical(trials));atomicWrite(join(out,'execution.json'),canonical(summary));console.log(JSON.stringify({...summary,showcase:summary.showcase.map(x=>({case_id:x.case_id,status:x.governance,expected:x.expected}))},null,2));return summary;
 }finally{ctx.witness.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))execute(process.argv[2]??'.rbb/governance-demo',Number(process.argv[3]??10));
