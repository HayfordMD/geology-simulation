import { StrataGrid } from '../src/simulation/StrataGrid.js';
import { TectonicPlates } from '../src/simulation/TectonicPlates.js';
import { GeologyEngine } from '../src/simulation/GeologyEngine.js';
import { EPOCHS } from '../src/config/epochs.js';

const grid = new StrataGrid();
const engine = new GeologyEngine(grid);

const report = (tag) => {
  let underCount = 0;
  const seaLevel = engine.currentEpoch.oceanLevel;
  let minElev = Infinity, maxElev = -Infinity, sum = 0;
  for (const c of grid.cells) {
    if (c.elevation < seaLevel) underCount++;
    if (c.elevation < minElev) minElev = c.elevation;
    if (c.elevation > maxElev) maxElev = c.elevation;
    sum += c.elevation;
  }
  const pctUnder = (underCount / grid.cells.length * 100).toFixed(1);
  const avg = (sum / grid.cells.length).toFixed(3);
  console.log(`[${tag}] Age: ${engine.currentAgeMa.toFixed(0)}Ma | Epoch: ${engine.currentEpoch.name} | SeaLevel: ${seaLevel} | Underwater: ${pctUnder}% | AvgElev: ${avg} | Min: ${minElev.toFixed(2)} | Max: ${maxElev.toFixed(2)}`);
};

report('START');

for (let i = 1; i <= 900; i++) {
  engine.setTimeScale(10_000_000);
  engine.update(0.05); // 5 Ma per tick
  if (i % 150 === 0) report('STEP ' + i);
}
report('FINAL');
