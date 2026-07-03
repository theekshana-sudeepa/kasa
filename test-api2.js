async function test() {
  const req1 = await fetch('https://mcp.kapruka.com/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025', capabilities: {}, clientInfo: { name: 'kasa', version: '1.0' } } })
  });
  const sessionId = req1.headers.get('mcp-session-id');
  
  const req2 = await fetch('https://mcp.kapruka.com/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Mcp-Session-Id': sessionId },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'kapruka_list_categories', arguments: { params: {} } } })
  });
  const json = await req2.json();
  console.log(JSON.stringify(json, null, 2));
}
test();
