export function slug(text) {
	return text
		.toLowerCase()
		.replace(/ /g, '-')
		.replace(/[^\w-]+/g, '')
		.replace(/--+/g, '-')
		.replace(/^-+/, '')
		.replace(/-+$/, '')
}


export function unserialize(str) {
	const obj = {};
	const regex = /s:\d+:"(.*?)";s:\d+:"(.*?)";/g;
	let match;
	while ((match = regex.exec(str)) !== null) {
		obj[match[1]] = match[2];
	}
	return obj;
}


export function htmlToMarkdown(html) {
  if (!html) return '';

  // Decode common HTML entities
  const decodeEntities = str =>
    str.replace(/&nbsp;/g, ' ')
       .replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'")
       .replace(/&copy;/g, '©')
       .replace(/&reg;/g, '®')
       .replace(/&euro;/g, '€')
       .replace(/&pound;/g, '£')
       .replace(/&yen;/g, '¥')
       .replace(/&cent;/g, '¢')
       .replace(/&mdash;/g, '—')
       .replace(/&ndash;/g, '–')
       .replace(/&hellip;/g, '…')
       .replace(/&lsquo;/g, '‘')
       .replace(/&rsquo;/g, '’')
       .replace(/&ldquo;/g, '“')
       .replace(/&rdquo;/g, '”')
       .replace(/&bull;/g, '•')
       .replace(/&trade;/g, '™');

  let md = html;

  // Paragraphs → double line breaks
  md = md.replace(/<p>(.*?)<\/p>/gis, '$1\n\n');

  // Bold / Italic
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<i>(.*?)<\/i>/gi, '_$1_');
  md = md.replace(/<em>(.*?)<\/em>/gi, '_$1_');

  // Links
  md = md.replace(/<a\s+href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)');

  // Handle nested lists recursively
  const processList = (listHtml, ordered = false) => {
    let counter = 1;
    return listHtml.replace(/<li>(.*?)<\/li>/gis, (_, liContent) => {
      // Check for nested <ul> or <ol>
      liContent = liContent.replace(/<ul>(.*?)<\/ul>/gis, (_, nested) =>
        '\n' + processList(nested, false)
      );
      liContent = liContent.replace(/<ol>(.*?)<\/ol>/gis, (_, nested) =>
        '\n' + processList(nested, true)
      );

      const prefix = ordered ? `${counter++}. ` : '- ';
      return prefix + liContent.trim();
    }).trim();
  };

  // Unordered lists
  md = md.replace(/<ul>(.*?)<\/ul>/gis, (_, content) => processList(content, false) + '\n');

  // Ordered lists
  md = md.replace(/<ol>(.*?)<\/ol>/gis, (_, content) => processList(content, true) + '\n');

  // Remove any remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = decodeEntities(md);

  // Trim whitespace & tabs from each line
  md = md.split('\n').map(line => line.trim()).join('\n');

  // Trim extra whitespace
  return md.trim();
}




export function markdownToHtml(md) {

	if (!md) return null;
  // Normalize line endings
  md = md?.replace(/\r\n?/g, '\n');

  // STEP 1: Extract code blocks and inline code
  const codeBlocks = [];
  md = md.replace(/```([\s\S]*?)```/g, (_, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const marker = `__CODEBLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre><code>${escaped}</code></pre>`);
    return marker;
  });

  const inlineCodes = [];
  md = md.replace(/`([^`\n]+)`/g, (_, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const marker = `__INLINECODE_${inlineCodes.length}__`;
    inlineCodes.push(`<code>${escaped}</code>`);
    return marker;
  });

  // STEP 2: Headings
  md = md.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
         .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
         .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
         .replace(/^### (.*)$/gm, '<h3>$1</h3>')
         .replace(/^## (.*)$/gm, '<h2>$1</h2>')
         .replace(/^# (.*)$/gm, '<h1>$1</h1>');

  // STEP 3: Blockquotes
  md = md.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');

  // STEP 4: Links
  md = md.replace(/$begin:math:display$([^$end:math:display$]+)]$begin:math:text$(\\S+?)(?:\\s+"(.*?)")?$end:math:text$/g,
    (_, text, url, title) => `<a href="${url}"${title ? ` title="${title}"` : ''}>${text}</a>`);

  // STEP 5: Emphasis
  md = md.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
         .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
         .replace(/\*(.+?)\*/g, '<em>$1</em>');

  // STEP 6: Horizontal rules
  md = md.replace(/^[-*_]{3,}$/gm, '<hr>');

  // STEP 7: Lists — handle nested lists
  function parseList(lines, startIndex = 0, indentLevel = 0) {
    let html = '';
    let i = startIndex;
    let tag = null;

    while (i < lines.length) {
      const line = lines[i];
      const match = /^(\s*)([*+-]|\d+\.)\s+(.*)/.exec(line);
      if (!match) break;

      const [ , indent, marker, content ] = match;
      const currentIndent = indent.length;

      // Start new list tag
      if (!tag) {
        tag = /^\d+\./.test(marker) ? 'ol' : 'ul';
        html += `<${tag}>\n`;
      }

      // Nested list
      if (currentIndent > indentLevel) {
        const nested = parseList(lines, i, currentIndent);
        html += nested.html;
        i = nested.nextIndex;
        continue;
      }

      // Close list if outdented
      if (currentIndent < indentLevel) break;

      html += `<li>${content.trim()}</li>\n`;
      i++;
    }

    if (tag) html += `</${tag}>\n`;
    return { html, nextIndex: i };
  }

  // Split into lines
  const lines = md.split('\n');
  let output = '';
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (/^\s*([*+-]|\d+\.)\s+/.test(line)) {
      const result = parseList(lines, index);
      output += result.html;
      index = result.nextIndex;
    } else {
      output += line + '\n';
      index++;
    }
  }

  md = output;

  // STEP 8: Paragraphs — wrap blocks not already HTML
  const blocks = md.split(/\n{2,}/).map(block => {
    const trimmed = block.trim();
    if (/^<(h\d|ul|ol|li|pre|blockquote|hr|p)/.test(trimmed)) return trimmed;
    if (!trimmed) return '';
    return `<p>${trimmed}</p>`;
  });

  let html = blocks.join('\n\n');

  // STEP 9: Restore code
  inlineCodes.forEach((htmlCode, i) => {
    html = html.replace(`__INLINECODE_${i}__`, htmlCode);
  });

  codeBlocks.forEach((htmlBlock, i) => {
    html = html.replace(`__CODEBLOCK_${i}__`, htmlBlock);
  });

  return html.trim();
}






export function jsonToTable(obj) {
	const entries = Object.entries(obj);

	let html = `
	<table border="1" cellspacing="0" cellpadding="5">
		<thead>
			<tr><th>Key</th><th>Value</th></tr>
		</thead>
		<tbody>`;

	for (const [key, value] of entries) {
		html += `
			<tr><td>${key}</td><td>${value}</td></tr>`;
	}

	html += `
		</tbody>
	</table>`;

	return html;
}