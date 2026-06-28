'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ContentBlock, getBlockLayoutClass } from '@/lib/content-blocks'

function isDirectVideoUrl(url: string) {
  return (
    /\.(mp4|webm|ogg)(\?|$)/i.test(url) ||
    (url.includes('digitaloceanspaces.com') && url.includes('/noi-lms/videos/'))
  )
}

function looksLikeHtml(content: string) {
  return /<[a-z][\s\S]*>/i.test(content)
}

function renderTextContent(content: string) {
  if (looksLikeHtml(content)) {
    return (
      <div
        className="prose max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }
  return (
    <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</div>
  )
}

function renderBlockContent(block: ContentBlock) {
  if (block.type === 'text') {
    return renderTextContent(block.content)
  }

  if (block.type === 'image' && block.content) {
    return (
      <div className="h-full">
        <img src={block.content} alt="" className="max-w-full h-auto rounded-lg" />
      </div>
    )
  }

  if (block.type === 'video' && block.content) {
    return (
      <div className="aspect-video">
        {isDirectVideoUrl(block.content) ? (
          <video src={block.content} controls className="w-full h-full rounded-lg bg-black" />
        ) : (
          <iframe
            src={block.content}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    )
  }

  if (block.type === 'button' && block.content && block.metadata?.url) {
    return (
      <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
        <Link
          href={block.metadata.url}
          {...(block.metadata.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {block.content}
        </Link>
      </Button>
    )
  }

  if (block.type === 'section') {
    const innerBlocks = block.metadata?.blocks || []
    return (
      <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-6 md:p-8 h-full">
        {block.content?.trim() && (
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{block.content}</h2>
        )}
        <BlockGrid blocks={innerBlocks} keyPrefix="section-inner" />
      </section>
    )
  }

  return null
}

function BlockGrid({ blocks, keyPrefix }: { blocks: ContentBlock[]; keyPrefix: string }) {
  if (!blocks.length) return null

  return (
    <div className="grid grid-cols-12 gap-6">
      {[...blocks]
        .sort((a, b) => a.order - b.order)
        .map((block, index) => (
          <div
            key={block._id || `${keyPrefix}-${index}`}
            className={getBlockLayoutClass(block.metadata?.width)}
          >
            {renderBlockContent(block)}
          </div>
        ))}
    </div>
  )
}

interface ContentBlocksRendererProps {
  blocks: ContentBlock[]
  className?: string
}

export default function ContentBlocksRenderer({ blocks, className = '' }: ContentBlocksRendererProps) {
  if (!blocks?.length) return null

  return (
    <div className={className}>
      <BlockGrid blocks={blocks} keyPrefix="root" />
    </div>
  )
}
