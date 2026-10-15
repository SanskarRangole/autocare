import React from 'react'
import { Sparkles, MessageSquare } from 'lucide-react'

export function AssistLauncher({ currentTab, onOpenAssist }) {
  if (currentTab === 'assist') return null

  return (
    <aside aria-label="AutoCare Assist Quick Access" className="fixed bottom-20 md:bottom-6 right-5 z-40">
      <button
        type="button"
        onClick={onOpenAssist}
        className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#17365D] via-[#1E40AF] to-[#2563EB] text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all border border-blue-400/30 backdrop-blur-md"
      >
        <div className="relative">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#17365D]" />
        </div>
        <span className="tracking-tight">AutoCare Assist</span>
        <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-white/20 tracking-wider">
          AI
        </span>
      </button>
    </aside>
  )
}
