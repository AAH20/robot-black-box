import {existsSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {VERSION as implementedProtocolVersion} from '../packages/robot-black-box-contract/src/index.mjs';

const statuses = new Set(['demonstrated', 'limited', 'not_demonstrated']);
const rootKeys = ['assessed_at', 'capabilities', 'event_schema_version', 'implementation', 'profile_id', 'protocol_version', 'schema'];
const capabilityKeys = ['evidence', 'id', 'limitations', 'status'];

function exactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}_OBJECT_REQUIRED`);
  if (Object.keys(value).sort().join('|') !== [...expected].sort().join('|')) throw new Error(`${label}_UNEXPECTED_KEYS`);
}

function strings(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.length === 0)) throw new Error(`${label}_STRINGS_REQUIRED`);
  if (new Set(value).size !== value.length) throw new Error(`${label}_DUPLICATE`);
}

export function validateConformanceProfile(profile, {root = process.cwd()} = {}) {
  exactKeys(profile, rootKeys, 'PROFILE');
  if (profile.schema !== 'rbb.conformance-profile.v1') throw new Error('PROFILE_SCHEMA_UNSUPPORTED');
  if (!/^[a-z0-9][a-z0-9._-]{2,127}$/.test(profile.profile_id)) throw new Error('PROFILE_ID_INVALID');
  if (!/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(profile.protocol_version)) throw new Error('PROTOCOL_VERSION_INVALID');
  if (profile.protocol_version !== implementedProtocolVersion) throw new Error('PROTOCOL_VERSION_IMPLEMENTATION_MISMATCH');
  const eventSchema = JSON.parse(readFileSync(`${root}/packages/robot-black-box-contract/src/event.schema.json`, 'utf8'));
  if (eventSchema?.properties?.schema_version?.const !== profile.event_schema_version) throw new Error('EVENT_SCHEMA_VERSION_IMPLEMENTATION_MISMATCH');
  if (!Number.isFinite(Date.parse(profile.assessed_at))) throw new Error('ASSESSED_AT_INVALID');
  if (!Array.isArray(profile.capabilities) || profile.capabilities.length === 0) throw new Error('CAPABILITIES_REQUIRED');

  const ids = new Set();
  for (const capability of profile.capabilities) {
    exactKeys(capability, capabilityKeys, 'CAPABILITY');
    if (!/^[a-z][a-z0-9._-]{2,127}$/.test(capability.id) || ids.has(capability.id)) throw new Error('CAPABILITY_ID_INVALID_OR_DUPLICATE');
    ids.add(capability.id);
    if (!statuses.has(capability.status)) throw new Error('CAPABILITY_STATUS_INVALID');
    strings(capability.evidence, 'CAPABILITY_EVIDENCE');
    strings(capability.limitations, 'CAPABILITY_LIMITATIONS');
    if (capability.status !== 'not_demonstrated' && capability.evidence.length === 0) throw new Error('CAPABILITY_EVIDENCE_REQUIRED');
    if (capability.status !== 'demonstrated' && capability.limitations.length === 0) throw new Error('CAPABILITY_LIMITATION_REQUIRED');
    for (const evidencePath of capability.evidence) {
      if (evidencePath.startsWith('/') || evidencePath.includes('..') || !existsSync(`${root}/${evidencePath}`)) throw new Error(`CAPABILITY_EVIDENCE_NOT_FOUND:${evidencePath}`);
    }
  }
  return {
    profile_id: profile.profile_id,
    protocol_version: profile.protocol_version,
    capabilities: profile.capabilities.length,
    demonstrated: profile.capabilities.filter(({status}) => status === 'demonstrated').length,
    limited: profile.capabilities.filter(({status}) => status === 'limited').length,
    not_demonstrated: profile.capabilities.filter(({status}) => status === 'not_demonstrated').length
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = process.argv[2];
  if (!path) throw new Error('usage: node scripts/validate-conformance-profile.mjs <profile.json>');
  const profile = JSON.parse(readFileSync(path, 'utf8'));
  console.log(JSON.stringify(validateConformanceProfile(profile), null, 2));
}
