export type ContentBlockType = 'text' | 'image' | 'video' | 'button' | 'section'

export type BlockLayoutWidth = 'full' | 'half' | 'third'

export interface ContentBlockMetadata {
  url?: string
  openInNewTab?: boolean
  blocks?: ContentBlock[]
  width?: BlockLayoutWidth
}

export const LAYOUT_WIDTH_OPTIONS: { value: BlockLayoutWidth; label: string; hint: string }[] = [
  { value: 'full', label: 'Full width', hint: 'Stacked on its own row' },
  { value: 'half', label: 'Half width', hint: 'Two blocks side by side' },
  { value: 'third', label: 'One third', hint: 'Up to three blocks per row' },
]

export function getBlockLayoutClass(width?: BlockLayoutWidth): string {
  switch (width) {
    case 'half':
      return 'col-span-12 md:col-span-6'
    case 'third':
      return 'col-span-12 sm:col-span-6 md:col-span-4'
    default:
      return 'col-span-12'
  }
}

export interface ContentBlock {
  type: ContentBlockType
  content: string
  order: number
  metadata?: ContentBlockMetadata
  _id?: string
}

export function isEmptyHtml(html: string): boolean {
  if (!html?.trim()) return true
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text.length === 0
}

export function normalizeBlockList(raw: unknown): ContentBlock[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((block: ContentBlock, index: number) => {
      const type = (block.type || 'text') as ContentBlockType
      const metadata = { ...(block.metadata || {}) }

      if (type === 'section' && Array.isArray(metadata.blocks)) {
        metadata.blocks = normalizeBlockList(metadata.blocks)
      } else if (type === 'section') {
        metadata.blocks = []
      }

      return {
        type,
        content: block.content || '',
        order: block.order ?? index + 1,
        metadata,
        _id: block._id,
      }
    })
    .sort((a, b) => a.order - b.order)
}

export function blocksToLegacyContent(blocks: ContentBlock[]): string {
  return [...blocks]
    .sort((a, b) => a.order - b.order)
    .map((block) => {
      if (block.type === 'text') return block.content
      if (block.type === 'image') return `[Image: ${block.content}]`
      if (block.type === 'video') return `[Video: ${block.content}]`
      if (block.type === 'button') return `[Button: ${block.content}]`
      if (block.type === 'section') {
        const title = block.content?.trim() || 'Section'
        const inner = blocksToLegacyContent(block.metadata?.blocks || [])
        return `[Section: ${title}]\n${inner}`
      }
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

export function legacyContentToBlocks(content: string): ContentBlock[] {
  if (!content?.trim()) return []
  return [{ type: 'text', content, order: 1 }]
}

export function normalizeContentBlocks(raw: unknown, legacyHtml?: string): ContentBlock[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return normalizeBlockList(raw)
  }
  if (legacyHtml?.trim()) {
    return [{ type: 'text', content: legacyHtml, order: 1 }]
  }
  return []
}

export function reorderBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.map((block, index) => ({
    ...block,
    order: index + 1,
    metadata:
      block.type === 'section'
        ? {
            ...block.metadata,
            blocks: reorderBlocks(block.metadata?.blocks || []),
          }
        : block.metadata,
  }))
}

export function createEmptyBlock(type: ContentBlockType, order: number): ContentBlock {
  if (type === 'section') {
    return {
      type: 'section',
      content: '',
      order,
      metadata: { blocks: [] },
    }
  }
  if (type === 'button') {
    return {
      type: 'button',
      content: '',
      order,
      metadata: { url: '', openInNewTab: false, width: 'full' },
    }
  }
  return { type, content: '', order, metadata: { width: 'full' } }
}
