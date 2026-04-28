import fs from 'fs';
import path from 'path';

function search(dir) {
  for(const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if(fs.statSync(full).isDirectory()) search(full);
    else if(full.endsWith('.js') || full.endsWith('.mjs')) {
      const p = fs.readFileSync(full, 'utf8');
      if (p.includes('process.')) {
         console.log(full, 'contains process.');
         // print matched lines
         const lines = p.split('\n');
         lines.forEach((l, i) => { if(l.includes('process.')) console.log(`   ${i}: ${l.substring(0, 80)}`); });
      }
    }
  }
}
search('node_modules/@google/genai');
