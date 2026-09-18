import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {localKey} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {DurableReportStore} from '../../packages/robot-black-box-grc-bridge/src/durable.mjs';
const root=resolve(process.argv[2]),request=JSON.parse(readFileSync(0,'utf8')),key=localKey(join(root,'durable-custody'),'durable-local'),store=new DurableReportStore(join(root,'durable-grc.sqlite'),key);
try{const receipt=store.attach(request.actor,request.report,{fault:process.argv[3]==='crash'?'exit_before_commit':null});const readback=store.reconcile(request.actor,request.report.id,request.report.purpose,request.report.expected_digest);console.log(JSON.stringify({pid:process.pid,receipt,readback_digest:readback.receipt.content_digest,verified_readback:readback.verified_readback}));}finally{store.close();}
