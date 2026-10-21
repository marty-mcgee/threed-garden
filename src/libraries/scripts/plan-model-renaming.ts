import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
// @ts-expect-error Standalone Node type stripping requires explicit .ts suffix.
import {planObjModelNames,planSyntyModelNames} from './model-renaming-core.ts';
async function main(){
 const args=process.argv.slice(2),values=new Map<string,string>();
 for(let i=0;i<args.length;i++){if(args[i]==='--help'){console.log('node --experimental-strip-types src/libraries/scripts/plan-model-renaming.ts --rule <obj-design|sm-synty> --snapshot <owner-names.json> --out <new-plan.json>');return;}if(!['--rule','--snapshot','--out'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--')||values.has(args[i]))throw Error('Use --rule <obj-design|sm-synty> --snapshot <owner-names.json> --out <new-plan.json>.');values.set(args[i],args[++i]);}
 if(!values.has('--snapshot')||!values.has('--out'))throw Error('--snapshot and --out are required.');
 const rule=values.get('--rule');if(rule!=='obj-design'&&rule!=='sm-synty')throw Error('Choose --rule obj-design or sm-synty.');
 const plan=(rule==='obj-design'?planObjModelNames:planSyntyModelNames)(JSON.parse(await readFile(values.get('--snapshot')!,'utf8'))),out=path.resolve(values.get('--out')!);
 await mkdir(path.dirname(out),{recursive:true});await writeFile(out,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
 const escape=(value:string)=>value.replace(/[|<>\r\n]/g,' ');
 await writeFile(out+'.md',['# Model renaming review','','Rule: '+rule+'. Original filenames remain unchanged.','','| Model ID | Original name | New name | Primary File |','| --- | --- | --- | --- |',...plan.changes.map(c=>`| ${c.id} | ${escape(c.before)} | ${escape(c.after)} | ${escape(c.primaryFileName)} |`),'',`Collisions: ${plan.collisions.length}; already named: ${plan.unchanged.length}.`].join('\n')+'\n',{flag:'wx'});
 console.log(JSON.stringify({out,changes:plan.changes.length,unchanged:plan.unchanged.length,collisions:plan.collisions,existingDuplicateGroups:plan.existingDuplicates.length},null,2));
}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
