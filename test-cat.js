const { getMCPClient } = require('./app/lib/mcp/client');

async function test() {
  const client = getMCPClient();
  const res = await client.listCategories();
  console.log(res);
}
test();
