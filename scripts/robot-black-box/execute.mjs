import {join,resolve} from 'node:path';
import {mkdirSync,existsSync} from 'node:fs';
import {canonical} from '../../packages/robot-black-box-contract/src/index.mjs';
import {atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {context,replay,benchmark} from '../../packages/robot-black-box-cli/src/index.mjs';
import {verifyBundle} from '../../packages/robot-black-box-verifier/src/index.mjs';
import {importReport} from '../../packages/robot-black-box-grc-bridge/src/index.mjs';
const out=resolve(process.argv[2]??'.rbb/local-demo');
if(existsSync(join(out,'execution.json')))throw Error('Execution exists; choose a new output directory to preserve original measurements.');
const ctx=context(join(out,'custody'));
try {
 const demonstrations=[];for(let i=0;i<7;i++)demonstrations.push(replay(ctx,{case_id:`H${i}`,out:join(out,'cases',`H${i}`),run_id:`demo-H${i}`}));
 const b=benchmark(ctx,{out:join(out,'benchmark'),seeds:50});
 const full=verifyBundle(join(out,'cases','H0'),ctx.trust,{latestHeads:ctx.witness.snapshot()});
 const bridge=await importReport(full,demonstrations[0].evaluation);atomicWrite(join(out,'grc-bridge.json'),canonical(bridge));
 atomicWrite(join(out,'execution.json'),canonical({schema:'rbb.execution.v1',out,completed_at:new Date().toISOString(),demonstrations,benchmark:b,bridge_summary:{content_digest:bridge.content_digest,durability:bridge.durability}}));
 console.log(JSON.stringify({out,benchmark_trials:b.trials,integrity_correct:b.integrity_correct,authorization_correct:b.arms[2].authorization_correct,append_p95_ms:b.append_p95_ms,bridge:bridge.durability},null,2));
}finally{ctx.witness.close();}
