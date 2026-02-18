import React from 'react';
import { Clock, TrendingUp, Package } from 'lucide-react';

export default function AuctionCard({ title, weight, currentBid, minBid, timeEnds, type, image, onBid }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-industrial-200 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-48 overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/20">
          {type}
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
           <h3 className="font-bold text-industrial-900 line-clamp-1">{title}</h3>
           <span className="flex items-center gap-1 text-xs font-semibold bg-industrial-100 text-industrial-600 px-2 py-1 rounded">
             <Package size={12} /> {weight}
           </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 my-4">
           <div>
              <p className="text-xs text-industrial-500 mb-1">Current Bid</p>
              <p className="text-lg font-bold text-nature-700">{currentBid}</p>
           </div>
           <div className="text-right">
              <p className="text-xs text-industrial-500 mb-1">Ends In</p>
              <div className="flex items-center justify-end gap-1 text-orange-600 font-medium text-sm">
                 <Clock size={14} /> {timeEnds}
              </div>
           </div>
        </div>

        <button 
           onClick={onBid}
           className="w-full py-2.5 bg-industrial-900 text-white rounded-lg font-medium text-sm hover:bg-industrial-800 transition-colors flex items-center justify-center gap-2"
        >
           Place Bid <TrendingUp size={14} />
        </button>
      </div>
    </div>
  )
}
