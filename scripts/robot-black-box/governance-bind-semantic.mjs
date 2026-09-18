import {readFileSync,cpSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {context} from '../../packages/robot-black-box-cli/src/index.mjs';
import {canonical} from '../../packages/robot-black-box-contract/src/index.mjs';
import {atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {governanceReplay} from './governance-execute.mjs';
import {authorizeContext} from '../../packages/robot-black-box-governance/src/context-access.mjs';
import {readSyntheticVault} from '../../packages/robot-black-box-governance/src/index.mjs';
const root=resolve(process.argv[2]??'.rbb/governance-demo');const execution=resolve(process.argv[3]??'.rbb/cognee-semantic-verified');
const semantic=JSON.parse(readFileSync(join(execution,'execution.json'),'utf8'));
const accessTrust=JSON.parse(readFileSync(join(execution,'custody/trust.json'),'utf8'));
authorizeContext(semantic.grant,accessTrust,{tenant:'tenant-a',role:'lab_operator',purpose:'governance_evaluation'},{at:semantic.at,source_id:'semantic-review',operation:'retrieve'});
const semanticSource=readSyntheticVault(resolve('examples/robot-black-box-governance/semantic-vault'),{tenant:'tenant-a',role:'lab_operator',purpose:'governance_evaluation'},{at:semantic.at}).find(n=>n.id==='semantic-review').content;
const simulation=JSON.parse(readFileSync('.rbb/simulation-executed/execution.json','utf8'));const ctx=context(join(root,'custody'));
try{
 const results=[];
 for(const [case_id,semanticControl,expected]of [['G22',null,'unknown'],['G23','denied_tenant','fail']]){
  const result=governanceReplay(ctx,{case_id,run_id:'demo-'+case_id,out:join(root,'cases',case_id),simulation,semantic,semanticControl,semanticSource});
  if(result.integrity!=='valid'||result.governance!==expected)throw Error('SEMANTIC_BINDING_BOUNDARY_FAILED');results.push(result);
 }
 atomicWrite(join(root,'custody/witness/latest-heads.json'),canonical(ctx.witness.snapshot()));
 const dest=resolve('examples/robot-black-box-governance/executed');
 for(const {case_id}of results)cpSync(join(root,'cases',case_id),join(dest,'cases',case_id),{recursive:true});
 cpSync(join(root,'custody/trust.json'),join(dest,'trust.json'));cpSync(join(root,'custody/witness/latest-heads.json'),join(dest,'latest-heads.json'));
 atomicWrite(join(dest,'semantic-access-trust.json'),canonical(accessTrust));atomicWrite(join(dest,'cognee-semantic-execution.json'),canonical(semantic));
 const report={schema:'rbb.semantic.binding.v1',results,scope:'Historical successful local Cognee extraction, embedding retrieval and restart receipts; deletion measured separately. Model, proprietary twin, biometric and workflow declarations in these cases remain synthetic. No sim-to-real assessment.'};
 atomicWrite(join(dest,'semantic-binding.json'),canonical(report));atomicWrite(join(root,'semantic-binding.json'),canonical(report));console.log(JSON.stringify(report,null,2));
}finally{ctx.witness.close();}
