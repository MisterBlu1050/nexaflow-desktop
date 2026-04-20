// ─────────────────────────────────────────────────────────────────────────────
// NexaMarkdown.tsx — Styled markdown renderer for NexaAI chat responses.
//
// Replaces the raw whitespace-pre-wrap <p> in NexaAIWindow.
// Handles: headings, bold, italic, bullets, ordered lists, inline code,
//          code blocks, blockquotes, horizontal rules, and tables.
// ─────────────────────────────────────────────────────────────────────────────

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

// ── Component map ─────────────────────────────────────────────────────────────
const components: Components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-[16px] font-bold text-slate-800 mt-4 mb-2 leading-snug first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[14px] font-semibold text-slate-700 mt-3 mb-1.5 leading-snug first:mt-0 border-b border-slate-100 pb-1">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[13px] font-semibold text-slate-600 mt-2.5 mb-1 leading-snug first:mt-0">
      {children}
    </h3>
  ),

  // Paragraph — compact line-height to match chat density
  p: ({ children }) => (
    <p className="text-[13px] text-slate-700 leading-relaxed mb-2 last:mb-0">
      {children}
    </p>
  ),

  // Emphasis
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-800">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-slate-600">{children}</em>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="list-none space-y-1 mb-2 pl-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 mb-2 pl-1 text-[13px] text-slate-700">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-[13px] text-slate-700 leading-relaxed">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
      <span>{children}</span>
    </li>
  ),

  // Inline code
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <code className="block bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-mono text-slate-700 overflow-x-auto whitespace-pre my-2">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-slate-100 text-slate-700 rounded px-1 py-0.5 text-[12px] font-mono">
        {children}
      </code>
    );
  },

  // Code block wrapper
  pre: ({ children }) => (
    <pre className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-[12px] font-mono text-slate-700 overflow-x-auto my-2">
      {children}
    </pre>
  ),

  // Blockquote — used for legal citations and key callouts
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-claude-accent pl-3 my-2 text-[13px] text-slate-500 italic">
      {children}
    </blockquote>
  ),

  // Horizontal rule — section separator
  hr: () => (
    <hr className="border-none border-t border-slate-200 my-3" />
  ),

  // Tables — for salary grids, risk matrices, competency grids
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full text-[12px] border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide text-[10px]">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-100 text-slate-700">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-slate-50 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2">
      {children}
    </td>
  ),
};

// ── Public component ──────────────────────────────────────────────────────────
interface NexaMarkdownProps {
  content: string;
}

export default function NexaMarkdown({ content }: NexaMarkdownProps) {
  return (
    <div className="nexa-markdown">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
