// Renderer Markdown minimal pour NexaAI (safe, basique)
export function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[s]);
}

export function renderMarkdownToHtml(md: string): string {
  if (!md) return '';
  let out = md.replace(/
\n/g, '\n');

  // Code blocks
  out = out.replace(/```[a-zA-Z0-9]*\n([\s\S]*?)```/g, (_m, code) => `<pre><code>${escapeHtml(code)}</code></pre>`);

  // Inline code
  out = out.replace(/`([^`]+)`/g, (_m, c) => `<code>${escapeHtml(c)}</code>`);

  // Headings
  out = out.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  out = out.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  out = out.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Bold / italic
  out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Links
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

  // Simple lists
  out = out.replace(/^\s*[-*+] (.*)$/gm, '<li>$1</li>');
  out = out.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');

  // Paragraphs
  out = out.split('\n\n').map(p => {
    if (/^<h|^<ul|^<pre|^<code|^<li/.test(p.trim())) return p;
    return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
  }).join('\n\n');

  return out;
}
