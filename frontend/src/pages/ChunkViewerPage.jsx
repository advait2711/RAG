import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, BarChart3, Database, ArrowRight } from 'lucide-react'
import axios from 'axios'
import ChunkCard from '../components/ChunkCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { CHUNK_COLORS, CHUNK_BORDER_COLORS } from '../components/ChunkCard'

export default function ChunkViewerPage({ sessionId, chunkData, onEmbedComplete, isEmbedded }) {
    const navigate = useNavigate()
    const [documentText, setDocumentText] = useState('')
    const [isLoadingDoc, setIsLoadingDoc] = useState(true)
    const [isEmbedding, setIsEmbedding] = useState(false)
    const [error, setError] = useState(null)
    const [activeChunkId, setActiveChunkId] = useState(null)

    useEffect(() => {
        async function fetchDocument() {
            try {
                const res = await axios.get(`/api/document?sessionId=${sessionId}`)
                setDocumentText(res.data.text)
            } catch (err) {
                setError('Failed to load document text.')
            } finally {
                setIsLoadingDoc(false)
            }
        }
        fetchDocument()
    }, [sessionId])

    const handleEmbed = async () => {
        setIsEmbedding(true)
        setError(null)
        try {
            await axios.post('/api/embed', { sessionId })
            onEmbedComplete()
        } catch (err) {
            setError(err.response?.data?.error || 'Embedding failed. Check your API keys.')
        } finally {
            setIsEmbedding(false)
        }
    }

    const renderHighlightedText = () => {
        if (!documentText || !chunkData?.chunks) return documentText

        const chunks = chunkData.chunks
        const parts = []
        let lastEnd = 0

        // Show the first part of the document (up to 5000 chars for performance)
        const displayText = documentText.substring(0, 5000)

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            if (chunk.startIndex > displayText.length) break

            // Text before this chunk
            if (chunk.startIndex > lastEnd) {
                parts.push(
                    <span key={`gap-${i}`} className="text-surface-200/30">
                        {displayText.substring(lastEnd, chunk.startIndex)}
                    </span>
                )
            }

            const colorIndex = i % CHUNK_COLORS.length
            const end = Math.min(chunk.endIndex, displayText.length)

            parts.push(
                <span
                    key={`chunk-${chunk.id}`}
                    className={`cursor-pointer transition-all duration-200 rounded px-0.5 ${activeChunkId === chunk.id ? 'ring-2 ring-white/40' : ''
                        }`}
                    style={{
                        background: CHUNK_COLORS[colorIndex],
                        borderBottom: `2px solid ${CHUNK_BORDER_COLORS[colorIndex]}`,
                    }}
                    onMouseEnter={() => setActiveChunkId(chunk.id)}
                    onMouseLeave={() => setActiveChunkId(null)}
                    title={`Chunk ${chunk.id}`}
                >
                    {displayText.substring(chunk.startIndex, end)}
                </span>
            )

            lastEnd = end
        }

        // Remaining text
        if (lastEnd < displayText.length) {
            parts.push(
                <span key="remaining" className="text-surface-200/30">
                    {displayText.substring(lastEnd)}
                </span>
            )
        }

        return parts
    }

    if (isEmbedding) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <LoadingSpinner message="Generating embeddings & storing in Pinecone..." />
                <p className="text-xs text-surface-200/30 mt-4">This may take a minute for larger documents</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold gradient-text">Chunk Viewer</h1>
                <p className="text-surface-200/60">
                    Visualize how your document was split into <span className="text-brand-400 font-medium">{chunkData?.totalChunks}</span> chunks
                </p>
            </div>

            {/* Stats Bar */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-center gap-8 text-sm flex-wrap">
                    <div className="flex items-center gap-3">
                        <BarChart3 size={16} className="text-brand-400" />
                        <div>
                            <span className="text-surface-200/40 text-xs block">Method</span>
                            <span className="font-medium text-surface-100 capitalize">{chunkData?.method}</span>
                        </div>
                    </div>
                    <div className="w-px h-10 bg-surface-700/50" />
                    <div className="text-center">
                        <span className="text-surface-200/40 text-xs block">Total Chunks</span>
                        <span className="font-bold text-brand-400 text-lg">{chunkData?.stats?.count}</span>
                    </div>
                    <div className="w-px h-10 bg-surface-700/50" />
                    <div className="text-center">
                        <span className="text-surface-200/40 text-xs block">Avg Size</span>
                        <span className="font-medium text-emerald-400">{chunkData?.stats?.avgSize} chars</span>
                    </div>
                    <div className="w-px h-10 bg-surface-700/50" />
                    <div className="text-center">
                        <span className="text-surface-200/40 text-xs block">Min / Max</span>
                        <span className="font-medium text-violet-400">
                            {chunkData?.stats?.minSize} / {chunkData?.stats?.maxSize}
                        </span>
                    </div>
                </div>
            </div>

            {/* Two-column layout: Document + Chunks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Document with Highlights */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Eye size={16} className="text-brand-400" />
                        <h2 className="text-sm font-bold text-surface-100">Document with Chunk Boundaries</h2>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto pr-2">
                        {isLoadingDoc ? (
                            <LoadingSpinner message="Loading document..." />
                        ) : (
                            <pre className="text-sm text-surface-200/70 leading-relaxed whitespace-pre-wrap font-sans">
                                {renderHighlightedText()}
                                {documentText.length > 5000 && (
                                    <span className="text-surface-200/30 italic block mt-4">
                                        ... showing first 5,000 of {documentText.length.toLocaleString()} characters
                                    </span>
                                )}
                            </pre>
                        )}
                    </div>
                </div>

                {/* Chunk List */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Database size={16} className="text-brand-400" />
                        <h2 className="text-sm font-bold text-surface-100">
                            Chunks (showing {chunkData?.chunks?.length} of {chunkData?.totalChunks})
                        </h2>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
                        {chunkData?.chunks?.map((chunk, index) => (
                            <ChunkCard
                                key={chunk.id}
                                chunk={chunk}
                                index={index}
                                isHighlighted={activeChunkId === chunk.id}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4">
                {!isEmbedded ? (
                    <button onClick={handleEmbed} className="btn-primary" disabled={isEmbedding}>
                        <div className="flex items-center gap-2">
                            <Database size={18} />
                            Generate Embeddings & Store in Pinecone
                        </div>
                    </button>
                ) : (
                    <button onClick={() => navigate('/query')} className="btn-primary">
                        <div className="flex items-center gap-2">
                            <ArrowRight size={18} />
                            Proceed to Query
                        </div>
                    </button>
                )}
            </div>
        </div>
    )
}
