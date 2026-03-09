import { useNavigate } from 'react-router-dom'
import { Layers, RotateCcw } from 'lucide-react'

export default function Navbar({ onReset }) {
    const navigate = useNavigate()

    const handleReset = () => {
        onReset()
        navigate('/upload')
    }

    return (
        <nav className="border-b border-brand-500/10 bg-surface-950/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                <div
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                    onClick={() => navigate('/upload')}
                >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
                        <Layers size={18} className="text-white" />
                    </div>
                    <span className="text-base sm:text-lg font-bold gradient-text">RAG Visualizer</span>
                </div>

                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-surface-200/70 hover:text-brand-400 transition-colors"
                >
                    <RotateCcw size={14} />
                    <span className="hidden sm:inline">Start Over</span>
                    <span className="sm:hidden">Reset</span>
                </button>
            </div>
        </nav>
    )
}
