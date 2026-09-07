import {mkdir,writeFile} from 'node:fs/promises';
const directory=new URL('../.preview/',import.meta.url);
await mkdir(directory,{recursive:true});
const results=await Promise.all(['products','categories'].map(async resource=>{
  const response=await fetch(`https://evergreenmarket.com.ua/api/${resource}`,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`Public ${resource}: HTTP ${response.status}`);
  const data=await response.json();
  if(!Array.isArray(data[resource]))throw new Error(`Invalid public ${resource} response`);
  return {resource,data};
}));
for(const {resource,data} of results)await writeFile(new URL(`${resource}.json`,directory),JSON.stringify(data));
await writeFile(new URL('fetched-at.txt',directory),new Date().toISOString());
console.log('Public catalog snapshots refreshed. No private data fetched.');
