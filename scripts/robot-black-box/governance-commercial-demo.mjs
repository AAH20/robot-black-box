import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {LocalCommercial} from '../../packages/robot-black-box-commercial/src/index.mjs';
import {canonical} from '../../packages/robot-black-box-contract/src/index.mjs';
import {atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {importReport} from '../../packages/robot-black-box-grc-bridge/src/index.mjs';
const execution=resolve(process.argv[2]??'.rbb/governance-demo');const directory=resolve(process.argv[3]??'.rbb/governance-commercial-executed');const service=new LocalCommercial(directory,execution);
try {
 const actor=role=>service.identities.find(x=>x.tenant==='tenant-a'&&x.role===role);const other=service.identities.find(x=>x.tenant==='tenant-b'&&x.role==='admin');
 for(let i=0;i<21;i++)service.ingest(actor('admin'),'G'+i);
 const baseline=service.export(actor('investigator'),'demo-G20','governance_evaluation');let purposeDenied=false;try{service.export(actor('investigator'),'demo-G20','handover_evaluation');}catch{purposeDenied=true;}
 const note=service.investigate(actor('investigator'),'demo-G20','Local LangGraph checkpoint receipt is signed with synthetic governance evidence; this establishes no legal certification.',baseline.governance.results[0].event_ids);
 service.hold(actor('admin'),'demo-G11',true);service.retention(actor('admin'),'demo-G11');let holdBlocked=false;try{service.deleteManaged(actor('admin'),'demo-G11');}catch{holdBlocked=true;}
 service.hold(actor('admin'),'demo-G11',false);const deletion=service.deleteManaged(actor('admin'),'demo-G11');
 const bridge=await importReport(baseline.verification,JSON.parse(readFileSync(join(execution,'cases/G20/evaluation.json'),'utf8')),baseline.governance);
 const report={schema:'rbb.governance.commercial.execution.v1',tenant_a_runs:service.runs(actor('admin')).length,tenant_b_runs:service.runs(other).length,purpose_denied:purposeDenied,cited_note:note,hold_blocked:holdBlocked,managed_deletion:deletion,bridge:{digest:bridge.content_digest,durability:bridge.durability},monitor:service.monitor(actor('investigator')),limits:'Public synthetic source replay and signed evidence retained; managed deletion does not delete source vault/vendor copies or establish enterprise retention.'};
 atomicWrite(join(directory,'execution.json'),canonical(report));atomicWrite(join(directory,'grc-bridge.json'),canonical(bridge));console.log(JSON.stringify(report,null,2));
}finally{service.close();}
