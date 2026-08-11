import DOMPurify from "isomorphic-dompurify";
import type { Topic } from "@/types/api";

/**
 * Renders a Topic (admin-authored CMS page) by data, reusable anywhere in the
 * app — the dynamic /pages/[key] route uses it, but any component can fetch a
 * topic by key (see useTopic) and render it the same way, e.g. inline teasers.
 */
export function TopicView({ topic }: { topic: Topic }) {
  const cleanHtml = DOMPurify.sanitize(topic.htmlContent);

  return (
    <article className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">{topic.title}</h1>
      {topic.subtitle && <p className="mt-2 text-lg text-muted-foreground">{topic.subtitle}</p>}
      <div
        className="mt-8 max-w-none text-white/90 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:my-4 [&_img]:rounded-lg [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_p]:leading-relaxed [&_strong]:font-semibold [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </article>
  );
}
