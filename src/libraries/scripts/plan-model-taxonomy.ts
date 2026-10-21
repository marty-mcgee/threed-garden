import { mkdir,readFile,writeFile } from 'node:fs/promises';
import path from 'node:path';
// @ts-expect-error Explicit suffix is required by standalone Node type stripping.
import { planModelTaxonomy,taxonomyPlanSummary } from './model-taxonomy-core.ts';

async function main() {
  const values=new Map<string,string>(),args=process.argv.slice(2);
  for(let i=0;i<args.length;i++) {
    if(args[i]==='--help') { console.log('node --experimental-strip-types src/libraries/scripts/plan-model-taxonomy.ts --snapshot <owner-snapshot.json> --out <new-plan.json>'); return; }
    if(!['--snapshot','--out'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--')||values.has(args[i]))throw Error('Use --snapshot <owner-snapshot.json> --out <new-plan.json>.');
    values.set(args[i],args[++i]);
  }
  if(!values.has('--snapshot')||!values.has('--out'))throw Error('--snapshot and --out are required.');
  const plan=planModelTaxonomy(JSON.parse(await readFile(values.get('--snapshot')!,'utf8'))),out=path.resolve(values.get('--out')!);
  await mkdir(path.dirname(out),{recursive:true});
  await writeFile(out,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
  const escape=(s:string)=>s.replace(/[|<>\r\n]/g,' ');
  const lines=['# Proposed Model taxonomy','',JSON.stringify(taxonomyPlanSummary(plan)),'','Review only. All approved flags start false; no live writes occurred. Existing taxonomy/assignments are retained.','','## Category paths','',...plan.categories.map(c=>`- ${c.path.join(' > ')} (${c.existingId===null?'proposed new':`existing #${c.existingId}`})`),'','## Model suggestions','','| Model ID | Model | Proposed path | Reason |','| --- | --- | --- | --- |',...plan.models.map(m=>`| ${m.id} | ${escape(m.name)} | ${escape(m.categoryKeys.at(-1)??'Manual review')} | ${escape(m.reason)} |`)];
  await writeFile(out+'.md',lines.join('\n')+'\n',{flag:'wx'});
  console.log(JSON.stringify({output:out,...taxonomyPlanSummary(plan)},null,2));
}
main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
