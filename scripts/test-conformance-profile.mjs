import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateConformanceProfile} from './validate-conformance-profile.mjs';

const valid = JSON.parse(readFileSync('conformance/reference-local-v1.json', 'utf8'));

test('published conformance profile is internally consistent and evidence paths exist', () => {
  assert.deepEqual(validateConformanceProfile(valid), {
    profile_id: 'rbb-reference-local-v1',
    protocol_version: '0.1.0',
    capabilities: 10,
    demonstrated: 4,
    limited: 3,
    not_demonstrated: 3
  });
});

test('a demonstrated claim cannot omit its evidence', () => {
  const changed = structuredClone(valid);
  changed.capabilities[0].evidence = [];
  assert.throws(() => validateConformanceProfile(changed), /CAPABILITY_EVIDENCE_REQUIRED/);
});

test('a capability cannot cite a missing or escaping path', () => {
  const changed = structuredClone(valid);
  changed.capabilities[0].evidence = ['../private/customer-evidence.json'];
  assert.throws(() => validateConformanceProfile(changed), /CAPABILITY_EVIDENCE_NOT_FOUND/);
});

test('capability identifiers are unique', () => {
  const changed = structuredClone(valid);
  changed.capabilities[1].id = changed.capabilities[0].id;
  assert.throws(() => validateConformanceProfile(changed), /CAPABILITY_ID_INVALID_OR_DUPLICATE/);
});

test('declared protocol version must match the implementation', () => {
  const changed = structuredClone(valid);
  changed.protocol_version = '0.2.0';
  assert.throws(() => validateConformanceProfile(changed), /PROTOCOL_VERSION_IMPLEMENTATION_MISMATCH/);
});

test('declared event schema must match the shipped schema', () => {
  const changed = structuredClone(valid);
  changed.event_schema_version = '2.0.0';
  assert.throws(() => validateConformanceProfile(changed), /EVENT_SCHEMA_VERSION_IMPLEMENTATION_MISMATCH/);
});
