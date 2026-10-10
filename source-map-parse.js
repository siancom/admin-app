const fs = require('fs');
const sourceMap = require('source-map');

async function run() {
  const mapPath = 'dist/assets/index-Du2qvOMm.js.map';
  if (!fs.existsSync(mapPath)) {
      console.log('Source map not found!');
      return;
  }
  const rawSourceMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);
  const pos = consumer.originalPositionFor({
    line: 39,
    column: 37574
  });
  console.log(pos);
  consumer.destroy();
}
run();
