import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Allow ordinary web/relative links; HTML, executable URLs and embedded data are not guide content. */
export function safeLearnUrl(url: string, key = 'href'): string | undefined {
  const value = url.trim();
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value) || value.startsWith('//')) return undefined;
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(value)?.[1].toLowerCase();
  if (scheme && scheme !== 'https' && scheme !== 'http' && !(scheme === 'mailto' && key === 'href')) return undefined;
  return value;
}

/** Shared by the public reader and Admin preview. Raw HTML is skipped, never executed. */
export function LearnMarkdown({ content }: { content: string }) {
  return <div className="min-w-0 space-y-4 break-words text-sm leading-7 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:font-semibold [&_h5]:font-semibold [&_h6]:font-semibold [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li>ul]:mt-2 [&_li>ol]:mt-2 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_hr]:border-border [&_code]:rounded [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted/30 [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:underline [&_a]:underline-offset-4 [&_img]:max-h-[36rem] [&_img]:max-w-full [&_img]:rounded-lg">
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={safeLearnUrl} components={{
      table: ({ children }) => <div className="max-w-full overflow-x-auto rounded-lg border"><table className="w-full border-collapse text-left [&_th]:border-b [&_th]:bg-muted/30 [&_th]:px-3 [&_th]:py-2 [&_td]:border-b [&_td]:px-3 [&_td]:py-2">{children}</table></div>,
      a: ({ href, children, title }) => href ? <a href={href} title={title} rel="noopener noreferrer">{children}</a> : <span>{children}</span>,
      img: ({ src, alt, title }) => typeof src === 'string' && src ? <img src={src} alt={alt ?? ''} title={title} loading="lazy" decoding="async" /> : <span>{alt}</span>,
    }}>{content}</ReactMarkdown>
  </div>;
}
