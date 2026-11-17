/* Ninguna llave escrita en el Apps Script (el repo es PÚBLICO). Falla si en apps-script/ aparece algo como
   TOKEN: 'valor', API_KEY = "valor" o una llave dentro de PROPS_DEFAULT u objetos parecidos. Las llaves van en
   las Propiedades del script. Avisa (sin fallar) cuando una propiedad tiene un valor de repuesto escrito:
   getProperty('ALGO_TOKEN') || 'valor'.
   node .github/llaves-literales.js [carpeta apps-script] */
const fs = require('fs'), path = require('path');
const DIR = process.argv[2] || path.join(__dirname, '..', 'apps-script');
const NOMBRE = '[A-Za-z0-9_$]*(?:TOKEN|SECRET|SECRETO|PASSWORD|PASSWD|CONTRASENA|LLAVE|API_?KEY|PRIVATE_?KEY)[A-Za-z0-9_$]*';
const ASIGNA = new RegExp('(?:^|[^A-Za-z0-9_$.])[\'"]?(' + NOMBRE + ')[\'"]?\\s*[:=]\\s*[\'"`]([^\'"`]{4,})[\'"`]', 'gi');
const REPUESTO = new RegExp('getProperty\\(\\s*[\'"](' + NOMBRE + ')[\'"]\\s*\\)\\s*\\|\\|\\s*[\'"`][^\'"`]{4,}[\'"`]', 'gi');
let fallo = 0, n = 0;
function revisar(f) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(l)) return;
    for (const m of l.matchAll(ASIGNA)) {
      console.log('::error file=' + f + ',line=' + (i + 1) + '::' + m[1] + ' tiene un valor escrito en el código. Muévelo a las Propiedades del script y rota la llave (ya quedó pública).');
      fallo = 1;
    }
    for (const m of l.matchAll(REPUESTO))
      console.log('::warning file=' + f + ',line=' + (i + 1) + '::' + m[1] + ' tiene un valor de repuesto escrito. Quítalo cuando la propiedad esté puesta en producción.');
  });
  n++;
}
(function andar(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'archivo' && e.name !== 'node_modules') andar(p); }
    else if (/\.(js|gs)$/.test(e.name)) revisar(p);
  }
})(DIR);
if (!fallo) console.log('✓ ' + n + ' archivos de ' + DIR + ' sin llaves escritas');
process.exit(fallo);
