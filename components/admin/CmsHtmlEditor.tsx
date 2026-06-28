'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

const ReactQuill = dynamic(
  async () => {
    const mod = await import('react-quill')
    return mod.default
  },
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[300px] rounded-md border border-gray-200 bg-gray-50 animate-pulse"
        aria-hidden
      />
    )
  }
)

export type CmsHtmlEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  compact?: boolean
}

export default function CmsHtmlEditor({ value, onChange, placeholder, className, compact }: CmsHtmlEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ script: 'sub' }, { script: 'super' }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['blockquote', 'link'],
        ['clean']
      ]
    }),
    []
  )

  return (
    <div
      className={cn(
        'cms-html-editor rounded-md border border-gray-200 bg-white overflow-hidden text-gray-900',
        compact && 'cms-html-editor-compact',
        className
      )}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  )
}
