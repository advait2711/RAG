import { Hash, AlignLeft } from 'lucide-react'

// Color palette for chunk boundaries
const CHUNK_COLORS = [
    'rgba(99, 102, 241, 0.15)',   // brand/indigo
    'rgba(139, 92, 246, 0.15)',   // violet
    'rgba(34, 211, 238, 0.15)',   // cyan
    'rgba(52, 211, 153, 0.15)',   // emerald
    'rgba(251, 191, 36, 0.15)',   // amber
    'rgba(251, 113, 133, 0.15)',  // rose
    'rgba(167, 139, 250, 0.15)',  // purple
    'rgba(96, 165, 250, 0.15)',   // blue
]

const CHUNK_BORDER_COLORS = [
    'rgba(99, 102, 241, 0.4)',
    'rgba(139, 92, 246, 0.4)',
    'rgba(34, 211, 238, 0.4)',
    'rgba(52, 211, 153, 0.4)',
    'rgba(251, 191, 36, 0.4)',
    'rgba(251, 113, 133, 0.4)',
    'rgba(167, 139, 250, 0.4)',
    'rgba(96, 165, 250, 0.4)',
]

export default function ChunkCard({ chunk, index, isHighlighted = false }) {
    const colorIndex = index % CHUNK_COLORS.length

    return (
        <div
            className={`rounded-xl p-4 transition-all duration-300 ${isHighlighted ? 'ring-2 ring-brand-400 scale-[1.02]' : ''
                }`}
            style={{
                background: CHUNK_COLORS[colorIndex],
                borderLeft: `3px solid ${CHUNK_BORDER_COLORS[colorIndex]}`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Hash size={14} className="text-brand-400" />
                    <span className="text-xs font-bold text-brand-300">Chunk {chunk.id}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-surface-200/50">
                    <span className="flex items-center gap-1">
                        <AlignLeft size={12} />
                        {chunk.length || chunk.text.length} chars
                    </span>
                </div>
            </div>

            {/* Content */}
            <p className="text-sm text-surface-200/80 leading-relaxed whitespace-pre-wrap break-words line-clamp-6">
                {chunk.text}
            </p>

            {/* Position Indicator */}
            <div className="mt-3 flex items-center gap-2 text-xs text-surface-200/30">
                <span>Position: {chunk.startIndex} → {chunk.endIndex}</span>
            </div>
        </div>
    )
}

export { CHUNK_COLORS, CHUNK_BORDER_COLORS }
