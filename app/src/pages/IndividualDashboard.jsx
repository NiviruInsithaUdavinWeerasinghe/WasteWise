import React from 'react';
import HistoryTable from '../components/HistoryTable.jsx';
import { ShoppingBag, Star, TrendingUp, DollarSign, Leaf, Bell, Truck, Bookmark, ArrowRight, Clock, AlertCircle, Box, CheckCircle } from 'lucide-react';

export default function IndividualDashboard() {
  const purchaseLimit = 5000;
  const currentSpent = 3250;
  const limitPercentage = (currentSpent / purchaseLimit) * 100;

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Eco-Badge */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
           <p className="text-industrial-400">Manage your purchases, bids, and small-scale upcycling projects.</p>
        </div>
        <div className="bg-nature-900/40 p-4 rounded-xl border border-nature-500/20 flex items-center gap-4 shadow-sm min-w-[300px]">
           <div className="bg-industrial-900 p-3 rounded-full shadow-inner text-nature-400 border border-industrial-800">
              <Star size={24} fill="currentColor" />
           </div>
           <div>
             <h2 className="text-lg font-bold text-white">Eco-Crafter: Silver</h2>
             <p className="text-nature-400 text-xs">You've upcycled 45kg of waste into new creations!</p>
           </div>
        </div>
      </div>

      {/* Top Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
             <div className="flex items-center gap-3 mb-2 text-nature-500">
               <Leaf size={20} /> <span className="font-bold text-sm">Materials Rescued</span>
             </div>
             <div className="text-3xl font-bold text-white">45 <span className="text-lg text-industrial-500 font-medium">kg</span></div>
          </div>
          <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
             <div className="flex items-center gap-3 mb-2 text-orange-500">
               <TrendingUp size={20} /> <span className="font-bold text-sm">Active Bids</span>
             </div>
             <div className="text-3xl font-bold text-white">3</div>
          </div>
          <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
             <div className="flex items-center gap-3 mb-2 text-blue-500">
               <DollarSign size={20} /> <span className="font-bold text-sm">Total Spent</span>
             </div>
             <div className="text-3xl font-bold text-white">Rs 14,200</div>
          </div>
          <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800 flex flex-col justify-between">
             <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm text-industrial-300">Monthly Purchase Limit</span>
                <span className="text-xs font-bold text-industrial-500">Rs {currentSpent} / Rs {purchaseLimit}</span>
             </div>
             <div className="w-full bg-industrial-800 rounded-full h-2.5 mb-1 mt-4">
               <div className="bg-nature-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]" style={{ width: `${limitPercentage}%` }}></div>
             </div>
             <p className="text-xs text-industrial-500 mt-2 text-right">{100 - limitPercentage}% remaining</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Column: Ledger & Deliveries */}
         <div className="lg:col-span-2 space-y-8">
            {/* Purchase & Bid History */}
            <div className="bg-industrial-900 rounded-xl shadow-lg border border-industrial-800 overflow-hidden">
               <div className="p-6 border-b border-industrial-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Purchase & Bid History</h2>
               </div>
               <HistoryTable role="individual" />
            </div>

            {/* Delivery/Pickup Tracker */}
            <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
               <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                 <Truck size={20} className="text-blue-500" /> Active Deliveries & Pickups
               </h2>
               <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-industrial-800 bg-industrial-950/50">
                     <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                        <Box size={20} />
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-white">Cotton Offcuts (5kg)</h4>
                           <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Ready for Pickup</span>
                        </div>
                        <p className="text-sm text-industrial-400 mt-1">EcoRecycle Pvt Ltd • 123 Industrial Park, Colombo</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-industrial-800 bg-industrial-950/50">
                     <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                        <Clock size={20} />
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <h4 className="font-bold text-white">Mixed Fabric Bundle (3kg)</h4>
                           <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">Pending Factory Approval</span>
                        </div>
                        <p className="text-sm text-industrial-400 mt-1">Global Fibers • 45 Textile Road, Kandy</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Column: Alerts, Watchlist, Suggestions */}
         <div className="space-y-8">
            {/* Notification/Alert Center */}
            <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
               <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                 <Bell size={18} className="text-orange-500" /> Recent Alerts
               </h2>
               <div className="space-y-3">
                  <div className="flex gap-3 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                     <AlertCircle size={16} className="shrink-0 mt-0.5" />
                     <p>You have been outbid on <strong>Denim Scraps (2kg)</strong>.</p>
                  </div>
                  <div className="flex gap-3 text-sm p-3 rounded-lg bg-nature-500/10 border border-nature-500/20 text-nature-400">
                     <CheckCircle size={16} className="shrink-0 mt-0.5" />
                     <p>Payment successful for <strong>Cotton Offcuts (5kg)</strong>.</p>
                  </div>
               </div>
            </div>

            {/* Watchlist / Saved Items */}
            <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
               <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                 <Bookmark size={18} className="text-blue-500" /> Saved for Crafting
               </h2>
               <div className="space-y-4">
                  <div className="flex justify-between items-center group cursor-pointer border-b border-industrial-800 pb-3">
                     <div>
                        <h4 className="text-white text-sm font-medium group-hover:text-nature-400 transition-colors">Silk Thread Spools (1kg)</h4>
                        <p className="text-industrial-500 text-xs">Ends in 2 days</p>
                     </div>
                     <span className="text-industrial-300 font-mono text-sm font-bold">450 LKR</span>
                  </div>
                  <div className="flex justify-between items-center group cursor-pointer border-b border-industrial-800 pb-3">
                     <div>
                        <h4 className="text-white text-sm font-medium group-hover:text-nature-400 transition-colors">Leather Offcuts (2.5kg)</h4>
                        <p className="text-industrial-500 text-xs">Direct Sale</p>
                     </div>
                     <span className="text-industrial-300 font-mono text-sm font-bold">1,200 LKR</span>
                  </div>
                  <button className="w-full py-2 flex items-center justify-center gap-2 text-sm text-industrial-400 hover:text-white transition-colors">
                     View All Saved <ArrowRight size={14} />
                  </button>
               </div>
            </div>

            {/* Suggested Materials */}
            <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
               <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                 <Star size={18} className="text-yellow-500" /> Trending for Crafters
               </h2>
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-industrial-950 p-3 rounded-lg border border-industrial-800 hover:border-nature-500/50 transition-colors cursor-pointer group">
                     <div className="h-20 bg-industrial-800 rounded-md mb-2 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Yarn" />
                     </div>
                     <h4 className="text-xs text-white font-medium truncate">Mixed Yarn Endings</h4>
                     <p className="text-xs text-nature-400 font-bold mt-1">200 LKR</p>
                  </div>
                  <div className="bg-industrial-950 p-3 rounded-lg border border-industrial-800 hover:border-nature-500/50 transition-colors cursor-pointer group">
                     <div className="h-20 bg-industrial-800 rounded-md mb-2 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1604937455095-ef2fe3d46fcd?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Denim" />
                     </div>
                     <h4 className="text-xs text-white font-medium truncate">Denim Patches</h4>
                     <p className="text-xs text-nature-400 font-bold mt-1">150 LKR</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
