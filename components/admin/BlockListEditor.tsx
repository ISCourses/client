'use client'

import { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  GripVertical,
  Trash2,
  Image,
  Video,
  FileText,
  ArrowUp,
  ArrowDown,
  Upload,
  Loader2,
  MousePointerClick,
  LayoutGrid,
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import CmsHtmlEditor from '@/components/admin/CmsHtmlEditor'
import {
  ContentBlock,
  ContentBlockType,
  BlockLayoutWidth,
  createEmptyBlock,
  getBlockLayoutClass,
  isEmptyHtml,
  LAYOUT_WIDTH_OPTIONS,
  reorderBlocks,
} from '@/lib/content-blocks'

const BLOCK_TYPES: { type: ContentBlockType; label: string; icon: typeof FileText }[] = [
  { type: 'text', label: 'Text', icon: FileText },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'button', label: 'Button', icon: MousePointerClick },
  { type: 'section', label: 'Section', icon: LayoutGrid },
]

interface BlockListEditorProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  allowSections?: boolean
  nested?: boolean
}

export default function BlockListEditor({
  blocks,
  onChange,
  allowSections = true,
  nested = false,
}: BlockListEditorProps) {
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const availableTypes = allowSections
    ? BLOCK_TYPES
    : BLOCK_TYPES.filter((item) => item.type !== 'section')

  const updateBlocks = (next: ContentBlock[]) => {
    onChange(reorderBlocks(next))
  }

  const addBlock = (type: ContentBlockType) => {
    updateBlocks([...blocks, createEmptyBlock(type, blocks.length + 1)])
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} block added`)
  }

  const removeBlock = (index: number) => {
    updateBlocks(blocks.filter((_, i) => i !== index))
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) {
      return
    }
    const next = [...blocks]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    updateBlocks(next)
  }

  const handleDrop = (targetIndex: number) => {
    if (draggedBlockIndex === null || draggedBlockIndex === targetIndex) {
      setDraggedBlockIndex(null)
      return
    }
    const next = [...blocks]
    const [removed] = next.splice(draggedBlockIndex, 1)
    next.splice(targetIndex, 0, removed)
    updateBlocks(next)
    setDraggedBlockIndex(null)
  }

  const updateBlock = (index: number, patch: Partial<ContentBlock>) => {
    const next = [...blocks]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const updateBlockContent = (index: number, content: string) => {
    updateBlock(index, { content })
  }

  const updateBlockMetadata = (
    index: number,
    field: 'url' | 'openInNewTab' | 'blocks' | 'width',
    value: string | boolean | ContentBlock[] | BlockLayoutWidth
  ) => {
    const next = [...blocks]
    next[index] = {
      ...next[index],
      metadata: { ...next[index].metadata, [field]: value },
    }
    onChange(next)
  }

  const uploadFile = async (file: File, kind: 'image' | 'video') => {
    const formData = new FormData()
    formData.append(kind, file)
    const response = await api.post(`/upload/${kind}`, formData)
    return response.data.url as string
  }

  const handleBlockFileUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'image' | 'video'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIndex(index)
    try {
      const url = await uploadFile(file, kind)
      updateBlockContent(index, url)
      toast.success(`${kind === 'image' ? 'Image' : 'Video'} uploaded`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to upload ${kind}`)
    } finally {
      setUploadingIndex(null)
      e.target.value = ''
    }
  }

  const blockIcon = (type: ContentBlockType) => {
    const item = BLOCK_TYPES.find((b) => b.type === type)
    if (!item) return null
    const Icon = item.icon
    const colors: Record<ContentBlockType, string> = {
      text: 'text-blue-500',
      image: 'text-green-500',
      video: 'text-purple-500',
      button: 'text-red-500',
      section: 'text-amber-600',
    }
    return <Icon className={`h-5 w-5 ${colors[type]}`} />
  }

  const blockLabel = (block: ContentBlock) => {
    if (block.type === 'section') {
      return block.content?.trim() || 'Untitled section'
    }
    if (block.type === 'text' && !isEmptyHtml(block.content)) {
      const plain = block.content.replace(/<[^>]*>/g, '').trim()
      return plain.slice(0, 40) + (plain.length > 40 ? '…' : '')
    }
    if (block.type === 'button') return block.content || 'Button'
    return `${block.type} block`
  }

  return (
    <div className={nested ? 'space-y-3' : 'space-y-4'}>
      <div className={`flex flex-wrap gap-2 ${nested ? '' : 'pb-1'}`}>
        {availableTypes.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addBlock(type)}
            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
          >
            <Icon className="h-4 w-4 mr-1.5" />
            {label}
          </Button>
        ))}
      </div>

      {blocks.length > 0 ? (
        <div className="grid grid-cols-12 gap-3">
          {blocks.map((block, index) => (
            <div
              key={block._id || `${block.type}-${index}`}
              className={getBlockLayoutClass(block.metadata?.width)}
            >
              <BlockCard
                block={block}
                index={index}
                total={blocks.length}
                nested={nested}
                showLayout={block.type !== 'section'}
                dragged={draggedBlockIndex === index}
                uploading={uploadingIndex === index}
                blockIcon={blockIcon(block.type)}
                blockLabel={blockLabel(block)}
                onDragStart={() => setDraggedBlockIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => setDraggedBlockIndex(null)}
                onMoveUp={() => moveBlock(index, 'up')}
                onMoveDown={() => moveBlock(index, 'down')}
                onRemove={() => removeBlock(index)}
                onContentChange={(content) => updateBlockContent(index, content)}
                onMetadataChange={(field, value) => updateBlockMetadata(index, field, value)}
                onFileUpload={(e, kind) => handleBlockFileUpload(index, e, kind)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic col-span-12">
          {nested
            ? 'No blocks in this section yet. Use the buttons above to add content. Set width to Half or One third for side-by-side layout.'
            : 'No content blocks yet. Add text, media, buttons, or a section to get started.'}
        </p>
      )}
    </div>
  )
}

interface BlockCardProps {
  block: ContentBlock
  index: number
  total: number
  nested: boolean
  showLayout: boolean
  dragged: boolean
  uploading: boolean
  blockIcon: React.ReactNode
  blockLabel: string
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onContentChange: (content: string) => void
  onMetadataChange: (
    field: 'url' | 'openInNewTab' | 'blocks' | 'width',
    value: string | boolean | ContentBlock[] | BlockLayoutWidth
  ) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, kind: 'image' | 'video') => void
}

function BlockCard({
  block,
  index,
  total,
  nested,
  showLayout,
  dragged,
  uploading,
  blockIcon,
  blockLabel,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onRemove,
  onContentChange,
  onMetadataChange,
  onFileUpload,
}: BlockCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`transition-all ${
        block.type === 'section'
          ? 'bg-amber-50/50 border-amber-200'
          : nested
            ? 'bg-gray-50 border-gray-200'
            : 'bg-white border-gray-200'
      } ${dragged ? 'opacity-50 cursor-grabbing' : 'hover:border-gray-300 cursor-grab'}`}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical className="h-5 w-5 text-gray-400 shrink-0" />
            {blockIcon}
            <div className="min-w-0">
              <span className="text-sm font-medium text-gray-900 capitalize block truncate">
                {block.type} · {blockLabel}
              </span>
              <span className="text-xs text-gray-500">Order {block.order}</span>
            </div>
          </div>
          <BlockActions
            index={index}
            total={total}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onRemove={onRemove}
          />
        </div>

        {showLayout && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Layout width</label>
            <div className="flex flex-wrap gap-2">
              {LAYOUT_WIDTH_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onMetadataChange('width', value)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    (block.metadata?.width || 'full') === value
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {LAYOUT_WIDTH_OPTIONS.find((o) => o.value === (block.metadata?.width || 'full'))?.hint}
            </p>
          </div>
        )}

        {block.type === 'text' && (
          <CmsHtmlEditor
            value={block.content}
            onChange={onContentChange}
            placeholder="Write your content…"
            compact={nested}
          />
        )}

        {block.type === 'section' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Section title</label>
              <Input
                value={block.content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Optional section heading"
                className="bg-white border-gray-300"
              />
            </div>
            <div className="rounded-lg border border-amber-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">
                Blocks in this section
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Set blocks to Half width or One third to place them side by side on the same row.
              </p>
              <BlockListEditor
                blocks={block.metadata?.blocks || []}
                onChange={(innerBlocks) => onMetadataChange('blocks', innerBlocks)}
                allowSections={false}
                nested
              />
            </div>
          </div>
        )}

        {block.type === 'button' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Button label</label>
              <Input
                value={block.content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Learn more"
                className="bg-white border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Link URL</label>
              <Input
                value={block.metadata?.url || ''}
                onChange={(e) => onMetadataChange('url', e.target.value)}
                placeholder="https://example.com or /courses"
                className="bg-white border-gray-300"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={!!block.metadata?.openInNewTab}
                onChange={(e) => onMetadataChange('openInNewTab', e.target.checked)}
                className="rounded border-gray-300"
              />
              Open in new tab
            </label>
          </div>
        )}

        {(block.type === 'image' || block.type === 'video') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {block.type === 'image' ? 'Image' : 'Video'} URL or upload
            </label>
            <div className="flex gap-2">
              <Input
                value={block.content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder={`Enter ${block.type} URL or upload file`}
                className="bg-white border-gray-300 flex-1"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => onFileUpload(e, block.type as 'image' | 'video')}
                accept={block.type === 'image' ? 'image/*' : 'video/*'}
                className="hidden"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
            </div>
            {block.type === 'image' && block.content && (
              <img src={block.content} alt="" className="max-h-48 rounded border object-contain" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BlockActions({
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button type="button" size="sm" variant="outline" onClick={onMoveUp} disabled={index === 0}>
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onMoveDown} disabled={index === total - 1}>
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onRemove} className="text-red-600">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
