import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, File, X, CheckCircle } from 'lucide-react'
import axios from 'axios'
import LoadingSpinner from '../components/LoadingSpinner'

export default function UploadPage({ onUploadComplete }) {
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState(null)

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)
        setError(null)
        const dropped = e.dataTransfer.files[0]
        if (dropped) {
            const ext = dropped.name.split('.').pop().toLowerCase()
            if (['txt', 'pdf'].includes(ext)) {
                setFile(dropped)
            } else {
                setError('Only .txt and .pdf files are supported.')
            }
        }
    }, [])

    const handleFileSelect = (e) => {
        setError(null)
        if (e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setIsUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('document', file)

            const response = await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            onUploadComplete(response.data)
            navigate('/chunk')
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    if (isUploading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <LoadingSpinner message="Parsing your document..." />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold gradient-text">Upload Your Document</h1>
                <p className="text-surface-200/60 text-lg max-w-md">
                    Drop a PDF or text file to start exploring how RAG chunking works
                </p>
            </div>

            {/* Dropzone */}
            <div
                className={`w-full max-w-xl glass-card-hover p-12 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-brand-400 bg-brand-500/10 scale-[1.02]' : ''
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
            >
                <input
                    id="file-input"
                    type="file"
                    accept=".txt,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {file ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <CheckCircle size={32} className="text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 justify-center">
                                <FileText size={16} className="text-brand-400" />
                                <span className="text-sm font-semibold text-surface-100">{file.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setFile(null)
                                    }}
                                    className="ml-1 text-surface-200/40 hover:text-rose-400 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <p className="text-xs text-surface-200/40">{formatFileSize(file.size)}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center float">
                            <Upload size={32} className="text-brand-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-surface-200/80">
                                Drag & drop your file here
                            </p>
                            <p className="text-xs text-surface-200/40">
                                or click to browse • PDF, TXT up to 10MB
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="w-full max-w-xl bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Upload Button */}
            {file && (
                <button onClick={handleUpload} className="btn-primary" disabled={isUploading}>
                    Process Document
                </button>
            )}

            {/* Supported Formats */}
            <div className="flex items-center gap-6 text-xs text-surface-200/30">
                <div className="flex items-center gap-2">
                    <FileText size={14} />
                    <span>.txt</span>
                </div>
                <div className="flex items-center gap-2">
                    <File size={14} />
                    <span>.pdf</span>
                </div>
            </div>
        </div>
    )
}
