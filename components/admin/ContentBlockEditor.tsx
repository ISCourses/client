'use client'

import BlockListEditor from '@/components/admin/BlockListEditor'
import { ContentBlock } from '@/lib/content-blocks'

interface ContentBlockEditorProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  description?: string
}

export default function ContentBlockEditor({ blocks, onChange, description }: ContentBlockEditorProps) {
  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-900 mb-1">Content blocks</label>
        <p className="text-xs text-gray-500">
          {description ||
            'Add rich text, images, videos, buttons, or sections. Drag blocks to reorder. Use Half width or One third to place blocks side by side.'}
        </p>
      </div>
      <BlockListEditor blocks={blocks} onChange={onChange} allowSections />
    </div>
  )
}
