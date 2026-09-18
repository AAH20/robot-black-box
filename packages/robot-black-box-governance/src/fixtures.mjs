import {readSyntheticVault,retrieveContext,removeLocalContext,PROFILE,validate} from './index.mjs';
import {canonical,digest,signed} from '../../robot-black-box-contract/src/index.mjs';
export const CASES=[
 ['G0','Valid governance baseline','pass'],['G1','Denied review purpose','fail'],['G2','Expired synthetic consent','fail'],['G3','Expired oversight approval','fail'],['G4','Stale retrieved context','unknown'],['G5','Conflicting graph context','unknown'],['G6','Unauthorized retrieval request','fail'],['G7','Source version changed','fail'],['G8','Twin embodiment mismatch','fail'],['G9','Missing biometric assessment evidence','unknown'],['G10','Deletion propagation incomplete','fail'],['G11','Local cache deletion and fixture vendor acknowledgement','pass'],['G12','Hostile source isolated as untrusted data','pass'],['G13','Context promoted to instruction','fail'],['G14','Missing workflow approval checkpoint','unknown'],['G15','VLA revision drift','fail'],['G16','Cognee provider unavailable','unknown'],['G17','Stale twin sensor provenance','unknown'],['G18','Missing proprietary-twin license declaration','unknown'],['G19','Sensitive capture request denied','fail']
].map(([id,title,gold])=>({id,title,gold}));
export function fixture({case_id='G0',seed=0,run_id,authority,vault}) {
 if(!CASES.some(c=>c.id===case_id))throw Error('UNKNOWN_GOVERNANCE_CASE');
 const at=new Date(Date.UTC(2026,8,17,12,0,0)+seed*60000).toISOString();const future=new Date(Date.parse(at)+3600000).toISOString();const past=new Date(Date.parse(at)-120000).toISOString();
 const actor={tenant:'tenant-a',role:PROFILE.role,purpose:PROFILE.purpose};const notes=readSyntheticVault(vault,actor,{at});
 const sources=notes.map(({content,decision,...s})=>s);
 for(const provider of ['cognee','langgraph'])sources.push({id:provider+'-context',provider,tenant:actor.tenant,role:actor.role,purpose:actor.purpose,version:'fixture-v1',current_version:'fixture-v1',digest:digest(canonical({provider,seed,source_digest:notes[0].digest})),observed_at:at,conflict:false,deleted:false,instruction_like:false,status:'simulated'});
 const doc={schema:'rbb.governance.evidence.v1',profile_version:'1.0.0',tenant:actor.tenant,run_id,case_id,at,purpose:PROFILE.purpose,model:{provider:'NVIDIA Isaac GR00T-style declaration',model_revision:'fixture-not-loaded-v1',expected_revision:'fixture-not-loaded-v1',weights_digest:digest('synthetic-weight-declaration-not-model-bytes'),config_digest:digest('synthetic-vla-config'),embodiment:'abstract-handover',scope:PROFILE.scope,license_declaration:'synthetic declaration; actual model license not assessed',status:'simulated'},twins:['oss','proprietary'].map(kind=>({source:kind==='oss'?'Isaac Lab-style fixture':'unspecified proprietary vendor fixture',kind,license_declaration:'synthetic asset MIT; vendor license not assessed',version:'fixture-v1',expected_version:'fixture-v1',asset_digest:digest('synthetic-'+kind+'-asset'),embodiment:'abstract-handover',scenario_digest:digest('synthetic-handover-scenario'),sensor_time:at,sim_to_real_assessed:true,status:'simulated'})),biometric:{subject_ref:'synthetic-subject-'+seed,synthetic:true,purpose:PROFILE.purpose,legal_basis_declaration:'synthetic evaluation declaration; jurisdiction review required',consent_expires:future,assessment_ref:'synthetic-assessment-v1-not-legal-opinion',human_review:true,raw_capture:false,matching_enabled:false,tracking_enabled:false,retention_until:future,status:'simulated'},sources,retrievals:[],workflow:{provider:'langgraph',graph_revision:'fixture-v1',thread_ref:'synthetic-thread-'+seed,checkpoint_ref:'fixture-checkpoint-v1',approval_checkpoint:true,status:'simulated'},deletion:{requested:false,source_ids:[],local_cache_removed:false,vendor_receipts:'not_requested',scope:'local synthetic context cache; source vault and immutable signed evidence retained'}};
 const cog=doc.sources.find(s=>s.provider==='cognee');
 if(case_id==='G1')doc.purpose='operational_identification';
 if(case_id==='G2')doc.biometric.consent_expires=past;
 if(case_id==='G4')cog.observed_at=past;
 if(case_id==='G5')cog.conflict=true;
 if(case_id==='G6')cog.tenant='tenant-b';
 if(case_id==='G7')cog.current_version='fixture-v2';
 if(case_id==='G8')doc.twins[1].embodiment='different-embodiment';
 if(case_id==='G9')doc.biometric.assessment_ref='missing';
 if(case_id==='G10'||case_id==='G11'){
  const cache=new Map(doc.sources.map(s=>[s.id,s.digest]));doc.deletion.requested=true;doc.deletion.source_ids=[cog.id];
  if(case_id==='G11'){const deletion=removeLocalContext(cache,[cog.id]);cog.deleted=true;doc.deletion.local_cache_removed=deletion.removed;doc.deletion.vendor_receipts='fixture_ack';}
  else doc.deletion.vendor_receipts='missing';
 }
 if(case_id==='G14')doc.workflow.approval_checkpoint=false;
 if(case_id==='G15')doc.model.model_revision='fixture-not-loaded-v2';
 if(case_id==='G16')cog.status='unavailable';
 if(case_id==='G17')doc.twins[0].sensor_time=past;
 if(case_id==='G18')doc.twins[1].license_declaration='missing';
 if(case_id==='G19')doc.biometric.raw_capture=true; // Declaration of denied request only; no sensitive bytes captured.
 doc.retrievals=retrieveContext(doc.sources,actor);
 if(case_id==='G13')doc.retrievals.find(r=>r.source_id==='vault-untrusted').treatment='promoted_instruction';
 const approval=signed({schema:'rbb.governance.approval.v1',issuer:authority.keyId,tenant:doc.tenant,run_id,role:PROFILE.role,scope:PROFILE.scope,document_digest:digest(canonical(doc)),profile_digest:digest(canonical(PROFILE)),not_before:new Date(Date.parse(at)-1000).toISOString(),expires_at:case_id==='G3'?past:future},authority.keyId,authority.privateKey,'GOVERNANCE-APPROVAL');
 doc.approval=approval;validate(doc);return doc;
}
