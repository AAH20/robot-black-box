import {readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {context} from '../../packages/robot-black-box-cli/src/index.mjs';
import {signed,canonical,digest} from '../../packages/robot-black-box-contract/src/index.mjs';
import {atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {readSyntheticVault,PROFILE} from '../../packages/robot-black-box-governance/src/index.mjs';
import {authorizeContext} from '../../packages/robot-black-box-governance/src/context-access.mjs';
const out=resolve(process.argv[2]??'.rbb/cognee-semantic-executed');if(existsSync(join(out,'execution.json')))throw Error('OUTPUT_EXISTS');
const ctx=context(join(out,'custody'));const actor={tenant:'tenant-a',role:PROFILE.role,purpose:PROFILE.purpose};
const at=new Date().toISOString();const grant=signed({schema:'rbb.context.access.v1',issuer:ctx.authority.keyId,tenant:actor.tenant,role:actor.role,purpose:actor.purpose,source_id:'semantic-review',operations:['ingest','retrieve','delete'],not_before:new Date(Date.parse(at)-1000).toISOString(),expires_at:new Date(Date.parse(at)+3600000).toISOString()},ctx.authority.keyId,ctx.authority.privateKey,'CONTEXT-ACCESS');
const decisions=[];let provider_calls=0;
function run(mode){
 const auth=authorizeContext(grant,ctx.trust,actor,{at:new Date().toISOString(),source_id:'semantic-review',operation:mode==='ingest'?'ingest':mode==='delete'?'delete':'retrieve'});decisions.push(auth);
 const notes=mode==='ingest'?readSyntheticVault(resolve('examples/robot-black-box-governance/semantic-vault'),actor,{at}):[];
 const content=notes.find(n=>n.id==='semantic-review')?.content??'';
 provider_calls++;const r=spawnSync(resolve('.rbb/cognee-runtime/bin/python'),['scripts/robot-black-box/cognee-semantic.py',join(out,'runtime'),mode],{input:content,encoding:'utf8',timeout:420000,maxBuffer:8*1024*1024});
 atomicWrite(join(out,mode+'-runtime.log'),(r.stdout??'')+'\n'+(r.stderr??''));
 const receiptFile=join(out,'runtime',mode+'-execution.json');
 if(!existsSync(receiptFile))throw Error('PROVIDER_NO_RECEIPT');
 const receipt=JSON.parse(readFileSync(receiptFile,'utf8'));if(r.status!==0||receipt.status!=='live_success')throw Error('PROVIDER_EXECUTION_UNAVAILABLE');return receipt;
}
const report={schema:'rbb.authorized.semantic.execution.v1',at,grant,models:JSON.parse(readFileSync('.rbb/local-models/manifest.json','utf8')),source:{id:'semantic-review',version:'semantic-demo-v1',path:'examples/robot-black-box-governance/semantic-vault/review.md',synthetic:true,treatment:'untrusted_data'},scope:'Real isolated single-user SDK; local separate authority key; source grants checked before vault reads and provider calls',decisions};
try{
 for(const [name,g,a]of [['expired',signed({...(({authentication,...body})=>body)(grant),expires_at:new Date(Date.parse(at)-1).toISOString()},ctx.authority.keyId,ctx.authority.privateKey,'CONTEXT-ACCESS'),actor],['altered_authority',{...grant,issuer:'unknown'},actor],['wrong_tenant',grant,{...actor,tenant:'tenant-b'}],['wrong_purpose',grant,{...actor,purpose:'operational_identification'}]]){
  let denied=false;try{authorizeContext(g,ctx.trust,a,{at,source_id:'semantic-review',operation:'retrieve'});}catch(e){denied=true;decisions.push({case:name,authorized:false,code:e.code,provider_invoked:false,source_content_read:false});}if(!denied)throw Error('DENIAL_BOUNDARY_FAILED');
 }
 report.ingest=run('ingest');report.restart=run('restart');
 if(report.ingest.pid===report.restart.pid||report.ingest.graph_nodes!==report.restart.graph_nodes||report.ingest.graph_edges!==report.restart.graph_edges||canonical(report.ingest.vector_rows)!==canonical(report.restart.vector_rows))throw Error('PERSISTENCE_VERIFICATION_FAILED');
 report.persistence_verified=true;report.deletion=run('delete');report.status='live_success';
}catch(e){report.status='partial_or_unavailable';report.error_code=e.message;}
finally{report.provider_calls=provider_calls;report.receipt_digest=digest(canonical({ingest:report.ingest??null,restart:report.restart??null,deletion:report.deletion??null}));atomicWrite(join(out,'execution.json'),canonical(report));atomicWrite(join(out,'custody/witness/latest-heads.json'),canonical(ctx.witness.snapshot()));ctx.witness.close();console.log(JSON.stringify({status:report.status,provider_calls,persistence_verified:report.persistence_verified,error_code:report.error_code},null,2));}
if(report.status!=='live_success')process.exitCode=3;
