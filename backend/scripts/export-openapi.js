/**
 * Write the generated OpenAPI spec to docs/api/openapi.json so it can be
 * imported into Postman/Insomnia or read without running the server.
 *
 * Usage: npm run docs:openapi
 */
const fs = require('fs');
const path = require('path');
const spec = require('../src/config/swagger');

const outFile = path.resolve(__dirname, '../../docs/api/openapi.json');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(spec, null, 2)}\n`);

const operations = Object.values(spec.paths).reduce(
  (n, item) => n + Object.keys(item).filter((k) => k !== 'parameters').length,
  0
);
console.log(`OpenAPI spec written to ${path.relative(process.cwd(), outFile)} (${operations} operations)`);
