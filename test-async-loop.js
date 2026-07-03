async function run() {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue('a');
      controller.close();
    }
  });
  
  const reader = stream.getReader();
  let count = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    count++;
    if (count > 5) break;
    console.log({ done, value });
  }
}
run();
