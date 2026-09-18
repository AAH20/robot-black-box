import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {SCHEMA,validate} from '../../packages/robot-black-box-governance/src/index.mjs';
const require=createRequire(new URL('../../media/robot-black-box-demo/package.json',import.meta.url));const Ajv=require('ajv');const engine=new Ajv({strict:false,validateFormats:false,allErrors:true}).compile(SCHEMA);const root=process.argv[2]??'.rbb/governance-demo';let count=0;
for(const folder of ['cases','benchmark'])for(const name of readdirSync(join(root,folder)))if(name.startsWith('G')){const d=JSON.parse(readFileSync(join(root,folder,name,'objects/governance-evidence'),'utf8'));validate(d);if(!engine(d))throw Error(JSON.stringify(engine.errors));count++;}
if(engine({schema:'unsupported'}))throw Error('INVALID_VECTOR_ACCEPTED');console.log(JSON.stringify({governance_documents:count,ajv:require('ajv/package.json').version,negative_vector_rejected:true}));
