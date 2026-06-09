import { KaprukaMCPClient } from './app/lib/mcp/client';

async function main() {
  const client = new KaprukaMCPClient();
  const res = await client.listDeliveryCities("gampaha");
  console.log(JSON.stringify(res, null, 2));
}

main();
