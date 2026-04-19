import path from 'path';
const mod = await import(new URL('./.tmp_es/commands.js', import.meta.url).href);
const commands = mod;
const cmds = ['/comp-analysis','/draft-offer','/onboarding','/people-report','/performance-review','/policy-lookup'];
for(const c of cmds){
  const args = c === '/draft-offer' ? 'Jane Doe; Senior Engineer; 2026-06-01; €68,000' : (c === '/policy-lookup' ? 'BE' : '');
  const resp = commands.handleSlashCommand(c, args, { employees: [], cases: ['CAS-001','CAS-002','CAS-003','CAS-004'] });
  console.log('\n---', c, '---');
  console.log(JSON.stringify(resp, null, 2));
}
