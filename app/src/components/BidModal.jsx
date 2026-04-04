import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, CheckCircle, Clock, MapPin, Package, Shield, Info, User, Archive, FileSignature } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function BidModal({ isOpen, onClose, item, onPlaceBid }) {
  const [amount, setAmount] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [liveBids, setLiveBids] = useState([]);
  const [sellerPhoto, setSellerPhoto] = useState(item.sellerPhoto || '');
  const { user } = useAuth();
  const scrollRef = useRef(null);

  const formatBids = (rawBids, defaultedBids = []) => {
    const active = (rawBids || []).map((b, i) => ({
      id: b._id || `real-${i}`,
      name: b.userId?.name || 'Bidder',
      profilePhoto: b.userId?.profilePhoto,
      amount: b.amount,
      time: new Date(b.timestamp || b.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(b.timestamp || b.createdAt || new Date()).getTime(),
      isDefaulted: false
    }));

    const defaulted = (defaultedBids || []).map((b, i) => ({
      id: b._id || `defaulted-${i}`,
      name: b.userId?.name || 'Previous Winner',
      profilePhoto: b.userId?.profilePhoto,
      amount: b.amount,
      time: new Date(b.date || b.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(b.date || b.createdAt || new Date()).getTime(),
      isDefaulted: true
    }));

    return [...active, ...defaulted].sort((a, b) => b.timestamp - a.timestamp);
  };

  const fetchBids = async () => {
    try {
      const listingId = item.id || item._id;
      if (!listingId) return;

      const response = await fetch(`${API_BASE_URL}/listings/${listingId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.bids || data.defaultedBids) {
          setLiveBids(formatBids(data.bids, data.defaultedBids));
        }
        if (data.sellerId?.profilePhoto) {
          setSellerPhoto(data.sellerId.profilePhoto);
        }
      }
    } catch (e) {
      console.error('Failed to poll bids', e);
    }
  };

  useEffect(() => {
    if (isOpen && item) {
      // Prioritize initializing with existing bids if provided
      if (item.realBids && liveBids.length === 0) {
        setLiveBids(formatBids(item.realBids, item.defaultedBids));
      }
      
      fetchBids();
      const interval = setInterval(fetchBids, 5000); 
      return () => clearInterval(interval);
    }
  }, [isOpen, item.id, item._id]);

  useEffect(() => {
     if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
     }
  }, [liveBids]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // First await the actual API call to safely record the bid!
      await onPlaceBid(amount);
      
      // If success, display the verified success splash
      setIsSuccess(true);
      
      // Update UI optimistically for the duration of the success animation
      setLiveBids(prev => [{
        id: Date.now(),
        name: user?.name || "You",
        amount: Number(amount),
        time: "Just now",
        isYou: true
      }, ...prev]);

      setTimeout(() => {
        setIsSuccess(false);
        setAmount('');
      }, 2000);
    } catch(error) {
       console.error("Bid placing halted:", error);
    }
  };

  const currentMinIncrease = Number(item.minBidIncrease) || 0;
  const minBid = liveBids.length > 0 ? (Number(liveBids[0].amount) + currentMinIncrease) : (Number(item.startingBid) || 100);

  return createPortal(
    <AnimatePresence>
      {isOpen && item && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-industrial-950/90 backdrop-blur-xl"
          />
          
          <motion.div
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="relative z-50 bg-industrial-900 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-industrial-800 flex flex-col md:flex-row max-h-[90vh]"
          >
          {isSuccess ? (
             <div className="p-12 text-center bg-industrial-900 w-full flex flex-col items-center justify-center min-h-[400px]">
                <motion.div 
                   initial={{ scale: 0 }} 
                   animate={{ scale: 1, rotate: 360 }} 
                   transition={{ type: "spring", damping: 15 }}
                   className="w-24 h-24 bg-nature-500/20 text-nature-400 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-nature-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                >
                   <CheckCircle size={48} />
                </motion.div>
                <h3 className="text-3xl font-bold text-white mb-2">Bid Confirmed!</h3>
                <p className="text-industrial-400 text-lg">You securely placed a bid of <span className="text-nature-400 font-bold">{Number(amount).toLocaleString()} LKR</span>.</p>
                <p className="text-industrial-500 text-sm mt-4">Returning to dashboard...</p>
             </div>
          ) : (
            <>
              {/* Close Button Mobile */}
              <button onClick={onClose} className="md:hidden absolute top-4 right-4 z-50 bg-industrial-950/50 text-white p-2 rounded-full border border-industrial-800"><X size={20}/></button>

              {/* Left Column: Item Details */}
              <div className="w-full md:w-3/5 bg-industrial-950 overflow-y-auto">
                 <div className="relative h-64 md:h-80 w-full">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-industrial-950 via-transparent to-black/30"></div>
                    <button onClick={onClose} className="hidden md:flex absolute top-4 left-4 bg-black/50 hover:bg-black/80 text-white px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur-md transition-colors items-center gap-1 text-sm font-medium">
                       <X size={16} /> Close Room
                    </button>
                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex gap-2 mb-3">
                           <span className="bg-nature-500/80 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-white/20">Live Auction</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight shadow-black drop-shadow-lg">
                          {(() => {
                            const type = item.type || "Material";
                            const m = type.match(/^(.+?)\s*\((.+?)\)$/);
                            if (m && m[2].toLowerCase().startsWith(m[1].toLowerCase())) return m[2];
                            return type;
                          })()} Procurement
                        </h2>
                    </div>
                 </div>

                 <div className="p-6 space-y-6">
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="bg-industrial-900 border border-industrial-800 rounded-xl p-4 text-center">
                          <Package size={20} className="text-industrial-400 mx-auto mb-2" />
                          <p className="text-xs text-industrial-500 uppercase tracking-wider font-bold mb-1">Volume</p>
                          <p className="text-white font-bold">{item.weight}</p>
                       </div>
                       <div className="bg-industrial-900 border border-industrial-800 rounded-xl p-4 text-center">
                          <MapPin size={20} className="text-blue-400 mx-auto mb-2" />
                          <p className="text-xs text-industrial-500 uppercase tracking-wider font-bold mb-1">Location</p>
                          <p className="text-white font-bold text-sm truncate">{item.location || 'Verified Facility'}</p>
                       </div>
                       <div className="bg-industrial-900 border border-industrial-800 rounded-xl p-4 text-center">
                          <Info size={20} className="text-orange-400 mx-auto mb-2" />
                          <p className="text-xs text-industrial-500 uppercase tracking-wider font-bold mb-1">Quality Grade</p>
                          <p className="text-white font-bold text-sm truncate">{item.condition || 'Factory Grade'}</p>
                       </div>
                       <div className="bg-industrial-900 border border-industrial-800 rounded-xl p-4 text-center">
                          <Shield size={20} className="text-nature-400 mx-auto mb-2" />
                          <p className="text-xs text-industrial-500 uppercase tracking-wider font-bold mb-1">Eligibility</p>
                          <p className="text-white font-bold text-sm">Green Cert</p>
                       </div>
                    </div>

                    {/* Description */}
                    <div>
                       <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><FileSignature size={18} className="text-industrial-400"/> Lot Information</h3>
                       <p className="text-industrial-400 text-sm leading-relaxed whitespace-pre-wrap">
                         {item.description || "No description provided."}
                       </p>
                    </div>

                    {/* Seller Banner */}
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-industrial-800 bg-industrial-900/50">
                       <div className="w-12 h-12 rounded-full bg-industrial-800 flex items-center justify-center border border-industrial-700 shrink-0 overflow-hidden">
                          {sellerPhoto ? (
                             <img src={sellerPhoto} alt={item.sellerName} className="w-full h-full object-cover" />
                          ) : (
                             <User size={24} className="text-industrial-500" />
                          )}
                       </div>
                       <div className="flex-1">
                          <h4 className="text-white font-bold text-sm flex items-center gap-2">
                            {item.sellerName || 'Verified Factory Source'} 
                            <CheckCircle size={14} className="text-blue-500" />
                          </h4>
                          <p className="text-xs text-nature-500">Verified Seller Network</p>
                       </div>
                       <button className="text-xs font-bold text-industrial-400 hover:text-white transition-colors bg-industrial-800 px-3 py-1.5 rounded-lg border border-industrial-700">View Profile</button>
                    </div>
                 </div>
              </div>

              {/* Right Column: Live Bidding */}
              <div className="w-full md:w-2/5 bg-industrial-900 flex flex-col items-stretch border-l border-industrial-800 relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
                 
                 {/* Bidding Header */}
                 <div className="p-6 border-b border-industrial-800 bg-industrial-950/30">
                    <div className="flex justify-between items-center mb-4">
                       <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${item.isClosed ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-orange-400 bg-orange-500/10 border-orange-500/20'}`}>
                          <Clock size={14} className={item.isClosed ? '' : 'animate-pulse'} /> {item.timeEnds || 'Ends Soon'}
                       </span>
                       <span className="text-industrial-400 text-xs font-medium">{liveBids.length} Bids Placed</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-industrial-400 text-sm font-medium mb-1">
                            {item.isClosed ? (liveBids.length > 0 ? "Winning Bid" : "Final Price") : "Current Highest Bid"}
                          </p>
                          <p className="text-3xl md:text-4xl font-black text-white tracking-tight">
                            {item.rawHighestBid 
                              ? <>{Number(item.rawHighestBid).toLocaleString()} <span className="text-xl text-nature-500">LKR</span></> 
                              : <>{item.currentBid?.replace('LKR', '') || '0'} <span className="text-xl text-nature-500">LKR</span></>}
                          </p>
                       </div>
                       <div className="text-right pb-1">
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] text-industrial-500 uppercase font-bold tracking-wider">Starting:</span>
                                <span className="text-xs text-industrial-300 font-mono font-bold">{(item.startingBid || 0).toLocaleString()} LKR</span>
                             </div>
                             <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] text-industrial-500 uppercase font-bold tracking-wider">Min Inr:</span>
                                <span className="text-xs text-nature-500 font-mono font-bold">+{(item.minBidIncrease || 0).toLocaleString()} LKR</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Live Feed */}
                 <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar" ref={scrollRef}>
                    <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-industrial-900 to-transparent z-10 pointer-events-none"></div>
                    <div className="space-y-4">
                        {liveBids.map((b, i) => (
                           <motion.div 
                              initial={i === 0 && !b.isDefaulted ? { opacity: 0, x: -20, bg: '#22c55e20' } : false}
                              animate={{ opacity: 1, x: 0, bg: 'transparent' }}
                              transition={{ duration: 0.5 }}
                              key={b.id} 
                              className={`flex justify-between items-center p-3 rounded-lg border ${b.isDefaulted ? 'bg-red-500/5 border-red-500/30 grayscale-[0.5]' : i === 0 ? 'bg-nature-500/5 border-nature-500/30' : 'bg-industrial-950 border-industrial-800'}`}
                           >
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ${b.isDefaulted ? 'bg-red-500 text-white' : b.isYou ? 'bg-blue-500 text-white' : i === 0 ? 'bg-nature-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-industrial-800 text-industrial-400'}`}>
                                    {b.profilePhoto ? (
                                       <img src={b.profilePhoto} alt={b.name} className="w-full h-full object-cover" />
                                    ) : (
                                       b.isYou ? 'You' : b.name.charAt(0)
                                    )}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                       <p className={`text-sm font-bold truncate ${b.isDefaulted ? 'text-red-400' : b.isYou ? 'text-blue-400' : i === 0 ? 'text-nature-400' : 'text-white'}`}>{b.name}</p>
                                       {b.isDefaulted && (
                                          <span className="shrink-0 text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Missed Payment</span>
                                       )}
                                    </div>
                                    <p className="text-xs text-industrial-500">{b.time}</p>
                                 </div>
                              </div>
                              <div className={`shrink-0 font-mono font-bold ${b.isDefaulted ? 'text-red-400/70 border-b border-red-500/20' : i === 0 ? 'text-nature-400' : 'text-industrial-300'}`}>
                                 {b.isDefaulted && <span className="text-[10px] mr-1">Rs</span>}
                                 {b.amount.toLocaleString()} LKR
                              </div>
                           </motion.div>
                        ))}
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-industrial-900 to-transparent z-10 pointer-events-none"></div>
                 </div>

                 {/* Bid Action Area */}
                 <div className="p-6 border-t border-industrial-800 bg-industrial-950/80 backdrop-blur-md">
                    {item.isClosed ? (
                       <div className="bg-industrial-900 p-4 rounded-xl text-center border border-industrial-800 shadow-inner">
                          <p className="text-sm font-bold text-red-400">Auction Closed</p>
                          <p className="text-xs text-industrial-500 mt-1">This listing is no longer accepting bids.</p>
                       </div>
                    ) : user?.role === 'company-seller' ? (
                       <div className="bg-industrial-900 p-4 rounded-xl text-center border border-industrial-800 shadow-inner">
                          <p className="text-sm font-bold text-industrial-300">Observer Mode</p>
                          <p className="text-xs text-industrial-500 mt-1">Sellers cannot participate in bidding.</p>
                       </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                         <div>
                            <div className="flex justify-between text-xs mb-2">
                               <span className="text-industrial-400 font-medium">Your Maximum Bid</span>
                               <span className="text-industrial-500 font-mono">Min: {minBid.toLocaleString()} LKR</span>
                            </div>
                            <div className="relative group">
                               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-industrial-500 font-bold">LKR</div>
                               <input 
                                 type="number" 
                                 required
                                 min={minBid}
                                 value={amount}
                                 onChange={(e) => setAmount(e.target.value)}
                                 className="w-full pl-14 pr-16 py-3 bg-industrial-900 border-2 border-industrial-700 rounded-xl focus:border-nature-500 focus:bg-industrial-950 transition-all outline-none font-mono font-black text-xl text-white placeholder-industrial-700 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                 placeholder={minBid.toString()}
                               />
                               <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  <button type="button" onClick={() => setAmount(minBid)} className="text-[10px] uppercase font-bold bg-industrial-800 hover:bg-industrial-700 transition-colors text-industrial-400 px-2 py-1 rounded">Min Bid</button>
                               </div>
                            </div>
                         </div>
                         <button type="submit" className="w-full group bg-gradient-to-r from-nature-600 to-nature-500 hover:from-nature-500 hover:to-nature-400 text-white font-black text-base py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] flex justify-center items-center gap-2">
                            Place Live Bid <TrendingUp size={20} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                         </button>
                         <p className="text-center text-[10px] text-industrial-500 uppercase tracking-widest px-4 leading-relaxed">
                            By placing a bid, you agree to the WasteWise Digital Trade Agreement SLAs.
                         </p>
                      </form>
                    )}
                 </div>
              </div>
            </>
          )}
        </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
