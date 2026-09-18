import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
const require=createRequire(new URL('../../media/robot-black-box-demo/package.json',import.meta.url));const Ajv=require('ajv');
const ajv=new Ajv({strict:false,validateFormats:false,allErrors:true});
const schema=JSON.parse(readFileSync(new URL('../../packages/robot-black-box-contract/src/event.schema.json',import.meta.url),'utf8'));const validate=ajv.compile(schema);
const root=resolve(process.argv[2]??'.rbb/local-demo');let count=0;
for(const folder of [join(root,'cases'),join(root,'benchmark','runs')])for(const name of readdirSync(folder)) {
 const lines=readFileSync(join(folder,name,'events.ndjson'),'utf8').trim().split('\n');for(const line of lines){const e=JSON.parse(line);if(!validate(e))throw Error(name+': '+JSON.stringify(validate.errors));count++;}
}
const invalid={schema_version:'unexpected'};if(validate(invalid))throw Error('Negative schema vector accepted');
console.log(`JSON Schema engine validation passed for ${count} exported events, AJV ${require('ajv/package.json').version}. Payload signatures are verified separately.`);
