function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractTagRobust(text, tagName) {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;
  
  let cleaned = text;
  let parsed = null;
  
  const lastCloseIdx = text.lastIndexOf(closeTag);
  
  if (lastCloseIdx !== -1) {
    const matchingOpenIdx = text.lastIndexOf(openTag, lastCloseIdx);
    
    if (matchingOpenIdx !== -1) {
      const rawContent = text.slice(matchingOpenIdx + openTag.length, lastCloseIdx).trim();
      const tryParse = safeParse(rawContent);
      if (tryParse) {
        parsed = tryParse;
      }
    }
  }

  while(cleaned.includes(closeTag)) {
    const cIdx = cleaned.indexOf(closeTag);
    const oIdx = cleaned.lastIndexOf(openTag, cIdx);
    if (oIdx !== -1) {
      cleaned = cleaned.slice(0, oIdx) + cleaned.slice(cIdx + closeTag.length);
    } else {
      cleaned = cleaned.slice(0, cIdx) + cleaned.slice(cIdx + closeTag.length);
    }
  }
  
  while (cleaned.includes(openTag)) {
    const oIdx = cleaned.indexOf(openTag);
    cleaned = cleaned.slice(0, oIdx);
  }

  return { 
    data: parsed, 
    cleaned: cleaned.trim() 
  };
}

const aiText = `Here are products:\n<PRODUCTS>[{"id":"hallucinated"}] \n<PRODUCTS>[{"id":"hallucinated2"}]`;
const backendTag = `\n<PRODUCTS>[{"product_id":"1","name":"Rabbit Electronic Toy","price":1750,"currency":"LKR","image_url":"","url":"","in_stock":true}]</PRODUCTS>`;

console.log('Finished:', extractTagRobust(aiText + backendTag, 'PRODUCTS'));
console.log('Streaming:', extractTagRobust(aiText + backendTag.replace('</PRODUCTS>', ''), 'PRODUCTS'));

