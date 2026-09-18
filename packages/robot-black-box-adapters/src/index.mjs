import {signed,digest,canonical} from '../../robot-black-box-contract/src/index.mjs';
import {DEFAULT_POLICY} from '../../robot-black-box-policy/src/index.mjs';
export const cases=['H0','H1','H2','H3','H4','H5','H6'];
// Ground truth is intervention-authored; never computed by the policy evaluator.
export const GOLD={H0:{integrity:'valid',authorization:'pass'},H1:{integrity:'valid',authorization:'fail'},H2:{integrity:'valid',authorization:'fail'},H3:{integrity:'valid',authorization:'unknown'},H4:{integrity:'invalid',authorization:'unknown'},H5:{integrity:'invalid',authorization:'unknown'},H6:{integrity:'valid',authorization:'unknown'}};
export function syntheticHandover({case_id='H0',seed=0,authority,producer_id='producer-local',run_id,tenant_ref='tenant-a'}) {
 if(!cases.includes(case_id)||!Number.isSafeInteger(seed)||seed<0)throw Error('CASE_OR_SEED');
 const config=digest('synthetic-model-and-runtime-v1');const changed=digest('synthetic-model-and-runtime-v2');const policy=digest(canonical(DEFAULT_POLICY));
 const source=digest(canonical({generator:'synthetic-handover-v1',case_id,seed}));const objects={};const events=[];
 const instant=(seconds)=>new Date(Date.UTC(2026,8,17,10,0,0)+seed*60000+seconds*1000).toISOString();
 const id=(type)=>`${run_id}-${type}`;
 const push=(type,seconds,payload,refs=[],extra={})=>{
  const e={schema_version:'1.0.0-local.1',event_id:id(type),system_id:'handover-synthetic-01',stream_id:'main',producer_id,boot_id:'epoch-1',event_type:type,observed_at:instant(seconds),monotonic_ns:String(seconds*1e9),clock:{clock_id:'synthetic-clock',status:'synchronized',max_uncertainty_ms:0},mode:'synthetic_replay',causal_refs:refs,provenance:{adapter_name:'synthetic-handover',adapter_version:'1.0.0',source_kind:'synthetic_episode',source_digest:source,source_offsets:[String(seconds)],claim_class:'synthetic'},config_digest:config,policy_digest:policy,payload,artifact_refs:[],privacy:{classification:'public_synthetic',purpose_id:'handover_evaluation',retention_policy_id:'synthetic_demo'},...extra};events.push(e);return e;
 };
 push('run.started',0,{task:'benign_block_handover',required_streams:['main'],trust_profile:'local_separate_witness',source_digest:source});
 const artifact=Buffer.from(canonical({frame_index:seed+1,block:'at source',mode:'synthetic'}));objects['observation-frame']=artifact;
 push('observation.recorded',1,{sensor_id:'synthetic-camera',frame_index:seed+1,value:'block at source','units':'abstract','coordinate_frame':'diagram','evidence_status':'synthetic'},[],{artifact_refs:[{object_id:'observation-frame',algorithm:'sha256',digest:digest(artifact),bytes:artifact.length,media_type:'application/json',capture_role:'synthetic_frame',availability:'available'}]});
 push('proposal.recorded',2,{action_id:'handover-1',input_refs:[id('observation.recorded')],requested_scope:'benign_block_handover',model_revision:'synthetic-no-inference-v1',action_representation:'abstract handover label, no actuator commands'},[id('observation.recorded')]);
 const grant=signed({schema:'rbb.approval.v1',decision:'allow',issuer:authority.keyId,role:'lab_operator',tenant_ref,system_id:'handover-synthetic-01',run_id,action_id:'handover-1',purpose:'handover_evaluation',task:'benign_block_handover',config_digest:config,policy_digest:policy,not_before:instant(0),expires_at:instant(case_id==='H1'?8:case_id==='H6'?10:30),nonce:`synthetic-${seed}-${case_id}`},authority.keyId,authority.privateKey,'APPROVAL');
 push('approval.recorded',3,{grant},[id('proposal.recorded')]);
 if(case_id==='H2')push('config.changed',5,{previous_config_digest:config,new_config_digest:changed,activated_at:instant(5)},[],{config_digest:changed});
 if(case_id==='H3')push('telemetry.gap',10,{affected_stream:'main',missing_interval:[instant(9),instant(10)],origin:'intentional_synthetic_intervention'});
 else push('execution.observed',10,{action_id:'handover-1',start:instant(9),end:instant(10),task_outcome:'success',evidence_status:'synthetic'},[id('proposal.recorded'),id('approval.recorded')],{config_digest:case_id==='H2'?changed:config,clock:{clock_id:'synthetic-clock',status:'synchronized',max_uncertainty_ms:case_id==='H6'?500:0}});
 push('run.closed',11,{status:case_id==='H3'?'interrupted':'complete',event_count:events.length+1,unresolved_gaps:case_id==='H3'?[id('telemetry.gap')]:[]},[]);
 return {events,objects,source_digest:source,case_id,seed,gold:GOLD[case_id]};
}
