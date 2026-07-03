function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractTag(text, tagName) {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;

  let cleaned = text;
  let parsed = null;
  let isStreaming = false;

  while (cleaned.includes(openTag)) {
    const startIdx = cleaned.indexOf(openTag);
    const contentStart = startIdx + openTag.length;
    const endIdx = cleaned.indexOf(closeTag, contentStart);

    if (endIdx === -1) {
      isStreaming = true;
      cleaned = cleaned.slice(0, startIdx).trim();
      break;
    }

    const rawContent = cleaned.slice(contentStart, endIdx).trim();
    const tryParse = safeParse(rawContent);
    if (tryParse) {
      parsed = tryParse;
    }
    cleaned = (cleaned.slice(0, startIdx) + cleaned.slice(endIdx + closeTag.length)).trim();
  }

  return { data: isStreaming ? null : parsed, cleaned };
}

const aiText = `Here are products:\n<PRODUCTS>[{"id":"hallucinated"}]`;
const backendTag = `\n<PRODUCTS>[{"product_id":"1","name":"Rabbit Electronic Toy","price":1750,"currency":"LKR","image_url":"","url":"","in_stock":true}]</PRODUCTS>`;

console.log(extractTag(aiText + backendTag, 'PRODUCTS'));
