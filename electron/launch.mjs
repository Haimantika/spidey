import {spawn} from 'node:child_process';
import electron from 'electron';
const env={...process.env};
// Some editor terminals inherit this variable from their Electron host.
delete env.ELECTRON_RUN_AS_NODE;
const child=spawn(electron,['.'],{stdio:'inherit',env});
child.on('exit',code=>process.exit(code??0));
child.on('error',error=>{console.error(error.message);process.exit(1);});
