import 'dotenv/config';
import { activateTheme, installTheme } from '../server/themes/service';

async function main() {
  const inst = await installTheme('pexen-maquette', false);
  console.log('installed', JSON.stringify(inst.appearance, null, 2));
  const act = await activateTheme('pexen-maquette');
  console.log('activated', JSON.stringify(act, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
