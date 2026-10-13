// Helpers for fields edited with the rich text editor (stored as HTML).
// Older records may still hold plain text, so callers check looksLikeHtml first.

export function looksLikeHtml(content: string) {
  return /<[a-z][\s\S]*>/i.test(content)
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' '
}

// Plain-text version of an HTML string, for short previews such as course cards
export function htmlToPlainText(content: string) {
  if (!content) return ''
  if (!looksLikeHtml(content)) return content
  return content
    .replace(/<(br|\/p|\/li|\/h[1-6]|\/blockquote)\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity])
    .replace(/\s+/g, ' ')
    .trim()
}

// True when the editor holds no visible text (an empty editor still outputs "<p><br></p>")
export function isRichTextEmpty(content: string) {
  return htmlToPlainText(content || '') === ''
}
