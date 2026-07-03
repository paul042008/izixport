import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#002E1A] flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        
        {/* Outer Orbital Ring - Represents global trade movement */}
        <div className="absolute w-32 h-32 border-[1px] border-[#C8991A]/30 rounded-full" />
        <div className="absolute w-32 h-32 border-t-2 border-[#C8991A] rounded-full animate-spin" 
             style={{ animationDuration: '1.5s' }} />

        {/* Logo Container with a subtle "breathing" effect */}
        <div className="relative w-28 h-28 flex items-center justify-center p-4 bg-white/5 rounded-full backdrop-blur-sm overflow-hidden">
          <img 
            src="public/logo.jpeg" // Ensure your logo path is correct
            alt="IziXport Logo" 
            className="w-full h-full object-contain animate-pulse"
          />
          
          {/* Professional Shimmer Overlay */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>

      {/* Status Text - Reinforces the marketplace's professional nature */}
      <div className="mt-8 flex flex-col items-center">
        <span className="text-[#C8991A] text-[10px] font-bold tracking-[0.3em] uppercase opacity-70">
          Global Trade Facilitator
        </span>
        <div className="mt-2 flex space-x-1">
          <div className="w-1 h-1 bg-[#C8991A] rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1 h-1 bg-[#C8991A] rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1 h-1 bg-[#C8991A] rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}