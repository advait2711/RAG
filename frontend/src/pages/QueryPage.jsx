import { useState } from 'react'
import { Search, Sparkles, FileText, ArrowRight } from 'lucide-react'
import axios from 'axios'
import LoadingSpinner from '../components/LoadingSpinner'
import ChunkCard from '../components/ChunkCard'

export default function QueryPage({ sessionId }) {
    const [query, setQuery] = useState('')
    const [isQuerying, setIsQuerying] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    const handleQuery = async () => {
        if (!query.trim()) return
        setIsQuerying(true)
        setError(null)
        setResult(null)

        try {
            const response = await axios.post('/api/query', {
                sessionId,
                query: query.trim(),
                topK: 5,
            })
            setResult(response.data)
        } catch (err) {
            setError(err.response?.data?.error || 'Query failed. Please try again.')
        } finally {
            setIsQuerying(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleQuery()
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3 px-2">
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Ask Your Document</h1>
                <p className="text-surface-200/60 text-sm sm:text-base max-w-lg mx-auto">
                    Query your chunks via semantic search. Relevant chunks will be retrieved and
                    sent to Gemini for a polished answer.
                </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto w-full px-2 sm:px-0">
                <div className="glass-card p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                        <Search size={20} className="text-surface-200/30 ml-2 sm:ml-3 shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything about your document..."
                            className="flex-1 bg-transparent border-none outline-none text-surface-100 placeholder-surface-200/30 py-3 px-2 text-sm sm:text-base"
                        />
                    </div>
                    <button
                        onClick={handleQuery}
                        disabled={!query.trim() || isQuerying}
                        className="btn-primary py-3 px-6 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        <Sparkles size={16} />
                        Ask
                    </button>
                </div>
            </div>

            {/* Loading */}
            {isQuerying && (
                <LoadingSpinner message="Searching chunks & generating answer..." />
            )}

            {/* Error */}
            {error && (
                <div className="max-w-2xl mx-auto bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-6">
                    {/* Gemini Answer */}
                    <div className="glass-card p-6 gradient-border">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={18} className="text-brand-400" />
                            <h2 className="text-lg font-bold text-surface-100">Gemini's Answer</h2>
                        </div>
                        <div className="text-surface-200/80 leading-relaxed whitespace-pre-wrap text-sm">
                            {result.answer}
                        </div>
                    </div>

                    {/* Retrieved Chunks */}
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={18} className="text-brand-400" />
                            <h2 className="text-lg font-bold text-surface-100">Retrieved Chunks</h2>
                            <span className="text-xs text-surface-200/40 ml-auto">
                                Top {result.retrievedChunks.length} most relevant
                            </span>
                        </div>
                        <div className="space-y-3">
                            {result.retrievedChunks.map((chunk, index) => (
                                <div key={chunk.id} className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-emerald-400 font-mono font-bold">
                                            {(chunk.score * 100).toFixed(1)}% match
                                        </span>
                                    </div>
                                    <ChunkCard chunk={chunk} index={index} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ask Another */}
                    <div className="text-center">
                        <button
                            onClick={() => {
                                setQuery('')
                                setResult(null)
                            }}
                            className="btn-secondary"
                        >
                            <div className="flex items-center gap-2">
                                <ArrowRight size={16} />
                                Ask Another Question
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!result && !isQuerying && !error && (
                <div className="text-center py-16 space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-brand-500/5 border border-brand-500/10 flex items-center justify-center mx-auto float">
                        <Search size={36} className="text-brand-400/40" />
                    </div>
                    <p className="text-surface-200/30 text-sm">
                        Your document is indexed and ready to query
                    </p>
                </div>
            )}
        </div>
    )
}
