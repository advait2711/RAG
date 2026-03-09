import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, Layers, GitBranch, Settings2, BarChart3 } from 'lucide-react'
import axios from 'axios'
import LoadingSpinner from '../components/LoadingSpinner'

const METHODS = [
    {
        id: 'fixed',
        name: 'Fixed-Size',
        icon: Scissors,
        description: 'Splits text into equal character-length chunks. Simple and predictable.',
        color: 'from-brand-500 to-brand-600',
        params: [
            { key: 'chunkSize', label: 'Chunk Size (chars)', default: 500, min: 50, max: 5000 },
        ],
    },
    {
        id: 'overlapping',
        name: 'Overlapping',
        icon: Layers,
        description: 'Fixed-size chunks with sliding window overlap, preserving context at boundaries.',
        color: 'from-violet-500 to-violet-600',
        params: [
            { key: 'chunkSize', label: 'Chunk Size (chars)', default: 500, min: 50, max: 5000 },
            { key: 'overlap', label: 'Overlap (chars)', default: 100, min: 10, max: 2000 },
        ],
    },
    {
        id: 'recursive',
        name: 'Recursive',
        icon: GitBranch,
        description: 'Hierarchically splits by paragraphs → sentences → words, keeping semantic structure.',
        color: 'from-cyan-400 to-cyan-500',
        params: [
            { key: 'chunkSize', label: 'Max Chunk Size (chars)', default: 500, min: 50, max: 5000 },
        ],
    },
]

export default function ChunkingPage({ sessionId, documentInfo, onChunkComplete }) {
    const navigate = useNavigate()
    const [selectedMethod, setSelectedMethod] = useState(null)
    const [paramValues, setParamValues] = useState({})
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState(null)

    const handleSelectMethod = (method) => {
        setSelectedMethod(method.id)
        const defaults = {}
        method.params.forEach((p) => {
            defaults[p.key] = p.default
        })
        setParamValues(defaults)
        setError(null)
    }

    const handleParamChange = (key, value) => {
        setParamValues((prev) => ({ ...prev, [key]: parseInt(value) || 0 }))
    }

    const handleProcess = async () => {
        if (!selectedMethod) return
        setIsProcessing(true)
        setError(null)

        try {
            const response = await axios.post('/api/chunk', {
                sessionId,
                method: selectedMethod,
                ...paramValues,
            })

            onChunkComplete(response.data)
            navigate('/view')
        } catch (err) {
            setError(err.response?.data?.error || 'Chunking failed. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <LoadingSpinner message="Splitting your document into chunks..." />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3 px-2">
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Choose Chunking Method</h1>
                <p className="text-surface-200/60 text-sm sm:text-base max-w-lg mx-auto">
                    Select how to split <span className="text-brand-400 font-medium break-all">{documentInfo?.fileName}</span> into
                    chunks. Each method has different trade-offs.
                </p>
            </div>

            {/* Document Info Bar */}
            <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm">
                <div className="text-center">
                    <span className="text-surface-200/40 text-xs block">File</span>
                    <span className="font-medium text-surface-100 break-all">{documentInfo?.fileName}</span>
                </div>
                <div className="hidden sm:block w-px h-8 bg-surface-700/50" />
                <div className="text-center">
                    <span className="text-surface-200/40 text-xs block">Characters</span>
                    <span className="font-medium text-brand-400">{documentInfo?.textLength?.toLocaleString()}</span>
                </div>
            </div>

            {/* Method Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {METHODS.map((method) => {
                    const Icon = method.icon
                    const isSelected = selectedMethod === method.id

                    return (
                        <div
                            key={method.id}
                            onClick={() => handleSelectMethod(method)}
                            className={`glass-card-hover p-6 cursor-pointer transition-all duration-300 ${isSelected ? 'ring-2 ring-brand-400 border-brand-400/30' : ''
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-4`}>
                                <Icon size={24} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-surface-100 mb-2">{method.name}</h3>
                            <p className="text-sm text-surface-200/50 leading-relaxed">{method.description}</p>

                            {isSelected && (
                                <div className="mt-5 pt-5 border-t border-brand-500/10 space-y-4">
                                    <div className="flex items-center gap-2 text-xs text-brand-400 font-medium">
                                        <Settings2 size={14} />
                                        Parameters
                                    </div>
                                    {method.params.map((param) => (
                                        <div key={param.key} className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <label className="text-surface-200/60">{param.label}</label>
                                                <span className="text-brand-400 font-mono font-bold">
                                                    {paramValues[param.key]}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={param.min}
                                                max={param.max}
                                                step={param.key === 'overlap' ? 10 : 50}
                                                value={paramValues[param.key]}
                                                onChange={(e) => handleParamChange(param.key, e.target.value)}
                                                className="w-full h-1.5 rounded-full appearance-none bg-surface-700/50 accent-brand-500 cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Process Button */}
            {selectedMethod && (
                <div className="flex justify-center">
                    <button onClick={handleProcess} className="btn-primary" disabled={isProcessing}>
                        <div className="flex items-center gap-2">
                            <BarChart3 size={18} />
                            Process Chunks
                        </div>
                    </button>
                </div>
            )}
        </div>
    )
}
