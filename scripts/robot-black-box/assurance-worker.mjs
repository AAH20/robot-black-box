import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {localKey,LocalWitness} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {TrustLifecycle} from '../../packages/robot-black-box-recorder/src/trust-lifecycle.mjs';
import {AssuranceService} from '../../packages/robot-black-box-recorder/src/assurance.mjs';
const root=resolve(process.argv[2]),config=JSON.parse(readFileSync(join(root,'config.json'))),authority=localKey(join(root,'custody/authority-keys'),'authority-local'),lifecycle=new TrustLifecycle(join(root,'trust.sqlite'),authority),trust=lifecycle.read().trust;
const key=localKey(join(root,'custody/producer-keys'),config.key_id),witnessKey=localKey(join(root,'custody/witness-private'),'witness-local'),witness=new LocalWitness(join(root,'custody/witness/heads.sqlite'),witnessKey,trust.producers),service=new AssuranceService(join(root,config.service_dir),{key,witness,trustLifecycle:lifecycle,run_id:config.run_id,interval_ms:config.interval_ms});
try{const results=await service.run({ticks:Number(process.argv[3]??3),artifacts:Object.fromEntries(Object.entries(config.artifacts).map(([id,data])=>[id,Buffer.from(data,'base64')])),faultAt:process.argv[4]==='fault'?0:null});console.log(JSON.stringify({pid:process.pid,results,status:service.status()}));}finally{service.close();witness.close();lifecycle.close();}
