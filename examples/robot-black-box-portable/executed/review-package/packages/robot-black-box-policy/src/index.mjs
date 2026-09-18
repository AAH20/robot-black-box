import {authenticate,canonical,digest,exact} from '../../robot-black-box-contract/src/index.mjs';
export const DEFAULT_POLICY={schema:'rbb.policy.v1',version:'1.0.0',task:'benign_block_handover',purpose:'handover_evaluation',required_role:'lab_operator',require_execution:true,require_complete:true};
export function evaluate(report,policy,trust) {
 const results=[];const add=(status,code,event_ids=[])=>results.push({status,code,event_ids});
 const facts=report.facts??[];const executions=facts.filter(e=>e.event_type==='execution.observed');
 if(report.integrity!=='valid')add('unknown','EVIDENCE_UNUSABLE');
 else {
  if(report.completeness!=='complete'&&policy.require_complete)add('unknown','EVIDENCE_INCOMPLETE');
  if(!executions.length)add('unknown','EXECUTION_MISSING');
  for(const execution of executions) {
   const proposals=facts.filter(e=>e.event_type==='proposal.recorded'&&e.payload.action_id===execution.payload.action_id&&execution.causal_refs.includes(e.event_id));
   if(proposals.length!==1){add('unknown','PROPOSAL_MISSING_OR_AMBIGUOUS',[execution.event_id]);continue;}
   const proposal=proposals[0];
   if(proposal.payload.requested_scope!==policy.task)add('fail','TASK_SCOPE_MISMATCH',[proposal.event_id]);
   if(!proposal.payload.input_refs.length||proposal.payload.input_refs.some(id=>!facts.some(e=>e.event_id===id&&e.event_type==='observation.recorded')))add('unknown','OBSERVATION_MISSING',[proposal.event_id]);
   const approvals=facts.filter(e=>e.event_type==='approval.recorded'&&execution.causal_refs.includes(e.event_id));
   if(approvals.length!==1){add('unknown','APPROVAL_MISSING_OR_AMBIGUOUS',[execution.event_id]);continue;}
   const approval=approvals[0];let grant;
   try {
    grant=authenticate(approval.payload.grant,trust.authorities,'APPROVAL');
    exact(grant,['schema','decision','issuer','role','tenant_ref','system_id','run_id','action_id','purpose','task','config_digest','policy_digest','not_before','expires_at','nonce'],'GRANT');
    const issuer=trust.authorities[approval.payload.grant.authentication.key_id];
    if(!issuer.tenants?.includes(execution.tenant_ref)||!issuer.roles?.includes(grant.role)||grant.issuer!==approval.payload.grant.authentication.key_id||grant.schema!=='rbb.approval.v1'||!['allow','deny','revoke'].includes(grant.decision)||!Number.isFinite(Date.parse(grant.not_before))||!Number.isFinite(Date.parse(grant.expires_at)))throw Error('AUTHORITY_SCOPE');
   }catch(err){add('unknown','AUTHORITY_UNVERIFIABLE',[approval.event_id]);continue;}
   const refs=[approval.event_id,execution.event_id];
   if(grant.decision!=='allow')add('fail','AUTHORITY_DENIED',refs);
   if(grant.tenant_ref!==execution.tenant_ref||grant.system_id!==execution.system_id||grant.run_id!==execution.run_id||grant.action_id!==execution.payload.action_id||grant.purpose!==policy.purpose||grant.task!==policy.task||grant.role!==policy.required_role)add('fail','APPROVAL_SCOPE_MISMATCH',refs);
   if(grant.config_digest!==execution.config_digest||grant.policy_digest!==digest(canonical(policy)))add('fail','CONFIG_OR_POLICY_BINDING_MISMATCH',refs);
   const u=Math.max(execution.clock.max_uncertainty_ms??Infinity,approval.clock.max_uncertainty_ms??Infinity);
   const start=Date.parse(execution.payload.start),end=Date.parse(execution.payload.end),nb=Date.parse(grant.not_before),exp=Date.parse(grant.expires_at);
   if(!Number.isFinite(u)||execution.clock.status!=='synchronized'||approval.clock.status!=='synchronized')add('unknown','CLOCK_UNTRUSTED',refs);
   else if(start-u>=exp||end-u>exp)add('fail','APPROVAL_EXPIRED',refs);
   else if(end+u<nb)add('fail','APPROVAL_NOT_YET_VALID',refs);
   else if(start-u<nb||end+u>exp)add('unknown','CLOCK_BOUNDARY_UNCERTAIN',refs);
   const revocations=facts.filter(e=>e.event_type==='approval.recorded'&&e!==approval);
   for(const r of revocations){try{const g=authenticate(r.payload.grant,trust.authorities,'APPROVAL');if(g.decision==='revoke'&&g.run_id===execution.run_id&&g.action_id===grant.action_id&&Date.parse(g.not_before)<=end)add('fail','APPROVAL_REVOKED',[r.event_id,execution.event_id]);}catch{add('unknown','REVOCATION_UNVERIFIABLE',[r.event_id]);}}
   const activeChanges=facts.filter(e=>e.event_type==='config.changed'&&Date.parse(e.payload.activated_at)<=end);
   if(activeChanges.length&&activeChanges.at(-1).payload.new_config_digest!==execution.config_digest)add('unknown','CONFIG_ACTIVATION_INCONSISTENT',[execution.event_id,activeChanges.at(-1).event_id]);
   if(!results.some(x=>x.event_ids.includes(execution.event_id)&&x.status!=='pass'))add('pass','APPROVAL_VALID_FOR_EXECUTION',refs);
  }
 }
 const authorization=results.some(r=>r.status==='fail')?'fail':results.some(r=>r.status==='unknown')?'unknown':results.length?'pass':'unknown';
 return {schema:'rbb.evaluation.v1',run_id:report.run_id,bundle_digest:report.bundle_digest,policy_digest:digest(canonical(policy)),trust_digest:report.trust_digest,authorization,execution_evidence:executions.length?'synthetic_observed':'missing',task_outcome:executions.length?executions.at(-1).payload.task_outcome:'unknown',results,limitations:report.limitations};
}
