import {authenticate,exact} from '../../robot-black-box-contract/src/index.mjs';
import {PROFILE} from './index.mjs';
export function authorizeContext(grant,trust,actor,{at,source_id,operation}){
 const deny=code=>{throw Object.assign(Error(code),{code});};
 try{authenticate(grant,trust.authorities,'CONTEXT-ACCESS');}catch{deny('CONTEXT_AUTHORITY_INVALID');}
 try{exact(grant,['schema','issuer','tenant','role','purpose','source_id','operations','not_before','expires_at','authentication'],'CONTEXT_GRANT');}catch{deny('CONTEXT_SCOPE_DENIED');}
 if(grant.issuer!==grant.authentication.key_id||!Array.isArray(grant.operations)||!grant.operations.length||grant.operations.some(x=>!['ingest','retrieve','delete'].includes(x)))deny('CONTEXT_SCOPE_DENIED');
 if(grant.schema!=='rbb.context.access.v1'||grant.tenant!==actor.tenant||grant.role!==actor.role||grant.purpose!==actor.purpose||actor.role!==PROFILE.role||actor.purpose!==PROFILE.purpose||grant.source_id!==source_id||!grant.operations?.includes(operation))deny('CONTEXT_SCOPE_DENIED');
 const now=Date.parse(at),start=Date.parse(grant.not_before),end=Date.parse(grant.expires_at);
 if(!Number.isFinite(now)||!Number.isFinite(start)||!Number.isFinite(end)||start>now||end<=now)deny('CONTEXT_APPROVAL_EXPIRED_OR_NOT_ACTIVE');
 return {authorized:true,source_id,operation,treatment:'untrusted_data',permission_effect:'none'};
}
