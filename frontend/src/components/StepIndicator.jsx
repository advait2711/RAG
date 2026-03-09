import { useNavigate, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'

export default function StepIndicator({ steps, currentStep }) {
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <div className="border-b border-brand-500/5 bg-surface-950/40">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                    {steps.map((step, index) => {
                        const isActive = location.pathname === step.path
                        const isCompleted = step.id < currentStep
                        const isClickable = step.id <= currentStep

                        return (
                            <div key={step.id} className="flex items-center">
                                {index > 0 && (
                                    <div
                                        className={`w-12 h-[2px] mx-1 transition-colors duration-300 ${isCompleted ? 'bg-brand-500' : 'bg-surface-700/50'
                                            }`}
                                    />
                                )}
                                <button
                                    onClick={() => isClickable && navigate(step.path)}
                                    disabled={!isClickable}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isActive
                                            ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                                            : isCompleted
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20'
                                                : 'bg-surface-800/30 text-surface-200/40 border border-surface-700/20'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <Check size={14} className="text-emerald-400" />
                                    ) : (
                                        <span
                                            className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${isActive
                                                    ? 'bg-brand-500 text-white'
                                                    : 'bg-surface-700/50 text-surface-200/50'
                                                }`}
                                        >
                                            {step.id}
                                        </span>
                                    )}
                                    {step.label}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
