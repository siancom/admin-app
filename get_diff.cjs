const fs = require('fs');
const log = fs.readFileSync('/Users/ittichai/.gemini/antigravity-ide/brain/fec2a87b-dd3f-4224-b98e-aec23403315f/.system_generated/logs/transcript.jsonl', 'utf8');
const lines = log.split('\n');
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.content && obj.content.includes("@@ -2966,140 +2966,43 @@")) {
      fs.writeFileSync('restored_block.txt', obj.content);
    }
  } catch(e){}
}
