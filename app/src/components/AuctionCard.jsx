import React from 'react';
import { Clock, TrendingUp, Package } from 'lucide-react';

export default function AuctionCard({ title, weight, currentBid, minBid, timeEnds, type, image, isSeller, isClosed, onBid }) {
  return (
    <div className="bg-industrial-900 rounded-xl shadow-lg border border-industrial-800 overflow-hidden hover:shadow-xl hover:border-industrial-700 transition-all group">
      <div className="h-48 overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/20">
          {type}
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
           <h3 className="font-bold text-white line-clamp-1">{title}</h3>
           <span className="flex items-center gap-1 text-xs font-semibold bg-industrial-800 text-industrial-300 px-2.5 py-1 rounded-md border border-industrial-700 shadow-inner">
             <Package size={12} /> {weight}
           </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 my-4">
           <div>
              <p className="text-xs text-industrial-400 mb-1">Current Bid</p>
              <p className="text-lg font-bold text-nature-400">{currentBid}</p>
           </div>
           <div className="text-right">
              <p className="text-xs text-industrial-400 mb-1">Status</p>
              <div className={`flex items-center justify-end gap-1 font-medium text-sm px-2 py-0.5 rounded-md inline-flex border ${isClosed ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-orange-400 bg-orange-500/10 border-orange-500/20'}`}>
                 <Clock size={14} /> {timeEnds}
              </div>
           </div>
        </div>

        <button 
           onClick={isClosed && !isSeller ? null : onBid}
           disabled={isClosed && !isSeller}
           className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
             (isClosed && !isSeller)
             ? 'bg-industrial-800 text-industrial-600 border border-industrial-800 cursor-not-allowed'
             : isSeller 
             ? 'bg-industrial-800 text-industrial-300 hover:bg-industrial-700 hover:text-white border border-industrial-700' 
             : 'bg-nature-600 text-white hover:bg-nature-500 shadow-lg shadow-nature-900/50'
           }`}
        >
           {isSeller ? 'View Listing' : isClosed ? 'Auction Closed' : 'Place Bid'} 
           {!isSeller && !isClosed && <TrendingUp size={16} />}
        </button>
      </div>
    </div>
  )
}
