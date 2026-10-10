// Usage: clone redblobgames/mapgen4 at ref below; npm ci/install --ignore-scripts;
// node scripts/vendor-mapgen.mjs /absolute/path/to/that/checkout
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const root=resolve(process.argv[2]),ref='c1d8cb018a11a8b9e17d59233c36c176429d37eb';
if(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()!==ref)throw Error('Unexpected upstream revision');
const out=resolve('public/vendor/mapgen'),records=[];
async function record(file,bytes,url,generated=false){await mkdir(dirname(`${out}/${file}`),{recursive:true});await writeFile(`${out}/${file}`,bytes);records.push({file:`vendor/mapgen/${file}`,url,sha256:createHash('sha256').update(bytes).digest('hex'),...(generated?{generated:true}:{})});}
for(const dir of ['', 'dual-mesh/'])for(const file of await readdir(`${root}/${dir}`))if(/\.(ts|js|json)$|^LICENSE$/.test(file)){
 const generated=file==='package-lock.json';
 await record(`source/${dir}${file}`,await readFile(`${root}/${dir}${file}`),generated?`https://github.com/redblobgames/mapgen4/tree/${ref}`:`https://raw.githubusercontent.com/redblobgames/mapgen4/${ref}/${dir}${file}`,generated);
}
const bridge=`
window.mapgen={
 status:()=>({ready:elapsedTimeHistory.length>0,working,regions:mesh.numRegions,elapsed:elapsedTimeHistory.at(-1)||0,seed:param.elevation.seed,painted:Painting.userHasPainted()}),
 dispose:()=>worker.terminate()
};
`;
const plugin={name:'exhibition-budget',setup(b){b.onLoad({filter:/(config\.js|render\.ts|mapgen4\.ts)$/},async args=>{let s=await readFile(args.path,'utf8');
 if(args.path.endsWith('config.js'))s=s.replace('spacing: 5.5','spacing: 10');
 if(args.path.endsWith('render.ts'))s=s.replace('const fbo_texture_size: number = 2048','const fbo_texture_size: number = 1024').replace('size = 2048;','size = 768;');
 if(args.path.endsWith('mapgen4.ts'))s=s.replace("['seed', 187,","['seed', (crypto.getRandomValues(new Uint32Array(1))[0] % (1 << 30)) || 1,").replace('    worker.postMessage({mesh, t_peaks, param});',bridge+'\n    worker.postMessage({mesh, t_peaks, param});');
 return {contents:s,loader:args.path.endsWith('.ts')?'ts':'js'};
});}};
await mkdir(`${root}/build`,{recursive:true});
await build({entryPoints:[`${root}/generate-points-file.ts`],bundle:true,platform:'node',format:'esm',external:['fs'],outfile:`${root}/build/_generate-points-file.js`,plugins:[plugin]});
execFileSync(process.execPath,['build/_generate-points-file.js'],{cwd:root,stdio:'inherit'});
await record('build/points-10.data',await readFile(`${root}/build/points-10.data`),`https://github.com/redblobgames/mapgen4/tree/${ref}`,true);
for(const [entry,name] of [['mapgen4.ts','_bundle.js'],['worker.ts','_worker.js']]){
 const result=await build({entryPoints:[`${root}/${entry}`],bundle:true,minify:true,write:false,plugins:[plugin],legalComments:'inline'});
 await record(`build/${name}`,result.outputFiles[0].contents,`https://github.com/redblobgames/mapgen4/tree/${ref}`,true);
}
for(const name of ['delaunator','robust-predicates','fast-2d-poisson-disk-sampling','flatqueue','gl-matrix','simplex-noise','@redblobgames/prng']){
 const base=`${root}/node_modules/${name}`,pkg=JSON.parse(await readFile(`${base}/package.json`));
 const license=(await readdir(base)).find(n=>/^licen[sc]e/i.test(n));if(!license)throw Error(`License missing ${name}`);
 await record(`licenses/${name.replaceAll('/','-')}.txt`,await readFile(`${base}/${license}`),`https://www.npmjs.com/package/${name}/v/${pkg.version}`);
}
await writeFile('public/vendor/mapgen-manifest.json',JSON.stringify(records,null,2)+'\n');
console.log('Mapgen4 bundled at spacing 10, 1024px buffers, 768px canvas.');
