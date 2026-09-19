/**
 * Strips HTML tags and decodes common entities — used anywhere a single line of
 * plain text is needed (list previews, titles). The backend's notification
 * composer stores rich HTML (<p>, <strong>, <br>, etc.); this converts it down
 * to plain text rather than showing the raw tags.
 */
export function htmlToPlainText(html?: string | null): string {
  if (!html) return "";

  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
