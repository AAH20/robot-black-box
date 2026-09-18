import {canonical,digest} from '../../robot-black-box-contract/src/index.mjs';
export async function importReport(verification,evaluation,governance=null) {
 const {EvidenceStore}=await import('../../evidence/dist/index.js');
 const {assessPhysicalAiSystem}=await import('../../physical-ai-assurance/dist/index.js');
 const {facts,...summary}=verification;
 const content=canonical({verification:summary,evaluation,...(governance?{governance}:{})});
 return importBytes(content,verification,evaluation,EvidenceStore,assessPhysicalAiSystem);
}
export function importBytes(content,verification,evaluation,EvidenceStore,assess) {
 const store=new EvidenceStore();
 const record=store.attach({tenantId:1,controlId:'robot-black-box-local',uri:`rbb://${verification.run_id}/report`,collectedAt:new Date().toISOString(),lineage:{source:'robot-black-box-local-replay'},content});
 if(record.sha256!==digest(content))throw Error('BRIDGE_CONTENT_DIGEST');
 const envelope=assess({systemId:verification.run_id,title:'Synthetic Robot Black Box replay evidence',source:'sample_manifest',scope:'Benign synthetic handover; local evidence reconstruction only',model:{provider:'other',modelFamily:'other',modelId:'synthetic-no-model-inference',endpointMode:'offline'},embodiment:{robotClass:'simulation_only',autonomyMode:'simulation_only',operatingDomain:'lab',prohibitedActionClasses:['all_live_actuation']},runtime:{loggingMode:'signed_local_sqlite_replay'},evidenceHashes:[record.sha256],controls:['nist_ai_rmf','iso_42001'],humanApproval:{required:true},limitations:['No physical test, deployed model, independent custody or safety certification.','Readiness is legacy metadata assessment, separate from authorization '+evaluation.authorization]});
 return {evidence:record,content_digest:digest(content),durability:'memory_only_local_demo',envelope};
}
export {DurableReportStore,reportBytes} from './durable.mjs';
export async function importDurableReport(verification,evaluation,governance,{store,actor,purpose}) {
 const {reportBytes}=await import('./durable.mjs');const content=reportBytes(verification,evaluation,governance),sha=digest(content);
 const receipt=store.attach(actor,{id:verification.run_id,purpose,content,expected_digest:sha});const readback=store.reconcile(actor,verification.run_id,purpose,sha);
 if(readback.content!==content||!readback.verified_readback)throw Error('BRIDGE_DURABLE_READBACK');
 const projection=await importReport(verification,evaluation,governance);
 return {...projection,durability:receipt.durability,durable_receipt:receipt,verified_readback:true,scope:'SQLite is durable report-byte source; existing EvidenceStore/envelope is an in-memory projection; no remote replication'};
}
