import { spawn } from 'node:child_process';
const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5180','--strictPort'], {stdio:'inherit',env:{...process.env,EG_READONLY_PREVIEW:'1',VITE_READONLY_PREVIEW:'1'}});
child.on('exit',code=>process.exit(code || 0));
child.on('error',error=>{console.error(error.message);process.exit(1);});
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>child.kill(signal));
