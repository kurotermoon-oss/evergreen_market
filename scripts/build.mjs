import { spawn } from 'node:child_process';
// Pin only this child process: a development NODE_ENV in the shell must not ship React's development runtime.
const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','build',...process.argv.slice(2)],{
  stdio:'inherit',env:{...process.env,NODE_ENV:'production'},
});
child.on('error',error=>{console.error(error.message);process.exit(1);});
child.on('exit',code=>process.exit(code??1));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
