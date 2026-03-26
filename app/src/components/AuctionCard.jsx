import React from 'react';
import { Clock, TrendingUp, Package } from 'lucide-react';

export default function AuctionCard({ title, weight, currentBid, minBid, timeEnds, type, image, isSeller, isClosed, onBid, compact = false }) {
  return (
    <div className={`glass-industrial rounded-3xl overflow-hidden hover:bg-white/5 transition-all group scale-100 hover:scale-[1.02] active:scale-[0.98] ${compact ? 'w-64 shrink-0' : ''}`}>
      <div className={`${compact ? 'h-32' : 'h-52'} overflow-hidden relative`}>
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute top-4 right-4 bg-industrial-950/60 backdrop-blur-md text-nature-400 px-3 py-1 rounded-full text-[10px] font-bold border border-nature-500/20 uppercase tracking-widest">
          {(() => {
            if (!type) return "";
            const match = type.match(/^(.+?)\s*\((.+?)\)$/);
            if (match) {
              const [_, main, sub] = match;
              if (sub.toLowerCase().startsWith(main.toLowerCase())) return sub;
            }
            return type;
          })()}
        </div>
      </div>
      <div className={compact ? 'p-4' : 'p-6'}>
        <div className="flex justify-between items-start mb-4">
           <h3 className={`font-bold text-white tracking-tight line-clamp-1 ${compact ? 'text-sm' : 'text-lg'}`}>{title}</h3>
           <span className={`flex items-center gap-1.5 font-bold text-industrial-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 ${compact ? 'text-[10px]' : 'text-xs'}`}>
             <Package size={compact ? 12 : 14} className="text-nature-500" /> {weight}
           </span>
        </div>
        
        <div className={`grid grid-cols-2 gap-4 ${compact ? 'my-3' : 'my-6'}`}>
           <div className="space-y-1">
              <p className={`text-industrial-500 font-bold uppercase tracking-tighter ${compact ? 'text-[9px]' : 'text-[10px]'}`}>Current Bid</p>
              <p className={`font-black text-nature-400 tracking-tight ${compact ? 'text-lg' : 'text-2xl'}`}>{currentBid}</p>
           </div>
           <div className="text-right space-y-1">
              <p className={`text-industrial-500 font-bold uppercase tracking-tighter ${compact ? 'text-[9px]' : 'text-[10px]'}`}>Status</p>
              <div className={`flex items-center justify-end gap-1.5 font-bold px-2 py-1 rounded-lg inline-flex border ${compact ? 'text-[9px]' : 'text-[11px]'} ${isClosed ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-orange-400 bg-orange-400/10 border-orange-400/20'}`}>
                 <Clock size={compact ? 12 : 14} /> {timeEnds}
              </div>
           </div>
        </div>

        <button 
           onClick={isClosed && !isSeller ? null : onBid}
           disabled={isClosed && !isSeller}
           className={`w-full rounded-2xl font-black transition-all flex items-center justify-center gap-2 tracking-wide uppercase ${compact ? 'py-2 text-[10px]' : 'py-4 text-xs'} ${
             (isClosed && !isSeller)
             ? 'bg-industrial-800 text-industrial-600 border border-industrial-800 cursor-not-allowed'
             : isSeller 
             ? 'glass-industrial text-industrial-300 hover:text-white border-white/20' 
             : 'bg-nature-600 text-white hover:bg-nature-500 shadow-xl shadow-nature-600/30'
           }`}
        >
           {isSeller ? 'View Transaction' : isClosed ? 'Closed' : 'Place Bid'} 
           {!isSeller && !isClosed && <TrendingUp size={compact ? 14 : 18} />}
        </button>
      </div>
    </div>
  )
}
