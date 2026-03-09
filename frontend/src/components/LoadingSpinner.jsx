import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ message = 'Processing...' }) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-brand-500/20 flex items-center justify-center pulse-glow">
                    <Loader2 size={28} className="text-brand-400 animate-spin" />
                </div>
            </div>
            <p className="text-surface-200/70 text-sm font-medium">{message}</p>
        </div>
    )
}
