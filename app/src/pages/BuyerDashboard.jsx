import React, { useState } from 'react';
import HistoryTable from '../components/HistoryTable.jsx';
import AuctionCard from '../components/AuctionCard.jsx';
import BidModal from '../components/BidModal.jsx';
import { Package, TrendingUp, DollarSign, CloudRain, Star, Truck, CheckCircle, FileSignature } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState('bids');
  const [selectedItem, setSelectedItem] = useState(null);

  const myBids = [
    {
      id: 2,
      title: "Polyester Rolls - Surplus Grade B",
      weight: "1,200 kg",
      currentBid: "185,000 LKR",
      rawHighestBid: 185000,
      timeEnds: "45m",
      type: "Polyester",
      condition: "Grade B Surplus",
      location: "Katunayake EPZ",
      sellerName: "TexFab Lanka",
      image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 5,
      title: "Sorted Denim Scraps",
      weight: "800 kg",
      currentBid: "95,000 LKR",
      rawHighestBid: 95000,
      timeEnds: "2h 30m",
      type: "Denim",
      condition: "Clean Sorted",
      location: "Biyagama EPZ",
      sellerName: "Global Fibers",
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Verification Badge */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Procurement Dashboard</h1>
           <p className="text-industrial-400">Manage bulk waste procurement, active contracts, and digital trade agreements.</p>
        </div>
        <div className="bg-nature-900/40 p-4 rounded-xl border border-nature-500/20 flex items-center gap-4 shadow-sm min-w-[300px]">
           <div className="bg-industrial-900 p-3 rounded-full shadow-inner text-nature-400 border border-industrial-800">
              <Star size={24} fill="currentColor" />
           </div>
           <div>
             <h2 className="text-lg font-bold text-white">Verified Recycler</h2>
             <p className="text-nature-400 text-xs">Tier 1 Sustainability Partner</p>
           </div>
        </div>
      </div>

      {/* Top Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
             <div className="flex items-center gap-3 mb-2 text-nature-500">
               <Package size={20} /> <span className="font-bold text-sm">Bulk Waste Procured</span>
             </div>
             <div className="text-3xl font-bold text-white">12.5 <span className="text-lg text-industrial-500 font-medium">Tonnes</span></div>
          </div>
          <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
             <div className="flex items-center gap-3 mb-2 text-orange-500">
               <TrendingUp size={20} /> <span className="font-bold text-sm">Bids / Contracts</span>
             </div>
             <div className="text-3xl font-bold text-white">14</div>
          </div>
          <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
             <div className="flex items-center gap-3 mb-2 text-blue-500">
               <DollarSign size={20} /> <span className="font-bold text-sm">Total Expenditure</span>
             </div>
             <div className="text-3xl font-bold text-white">1.8M <span className="text-lg text-industrial-500 font-medium">LKR</span></div>
          </div>
          <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-nature-500/30 text-center relative overflow-hidden group">
             <div className="absolute inset-0 bg-nature-500/5 group-hover:bg-nature-500/10 transition-colors"></div>
             <CloudRain size={24} className="text-nature-500 mx-auto mb-2 relative z-10" />
             <div className="text-2xl font-bold text-white relative z-10">4,250 <span className="text-sm text-nature-400 font-medium">kg CO₂</span></div>
             <p className="text-xs font-bold text-industrial-400 mt-1 relative z-10">Emissions Offset Aided</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left Column: Ledger & Bids */}
         <div className="lg:col-span-2 space-y-8">
            
            {/* Active Bids */}
            <div className="bg-industrial-900 rounded-xl shadow-lg border border-industrial-800 overflow-hidden pt-6">
               <div className="px-6 mb-6 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-white">Active Bids & Auctions</h2>
                 <button className="text-sm font-bold text-nature-500 hover:text-nature-400 transition-colors py-2 px-4 rounded-xl hover:bg-nature-500/10">Browse Supply &rarr;</button>
               </div>
               <div className="p-6 bg-industrial-950/30 border-t border-industrial-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                   {myBids.map(b => (
                     <AuctionCard 
                       key={b.id} 
                       {...b} 
                       onBid={() => setSelectedItem(b)} 
                     />
                   ))}
               </div>
            </div>

            {/* Procurement Ledger */}
            <div className="bg-industrial-900 rounded-xl shadow-lg border border-industrial-800 overflow-hidden">
               <div className="p-6 border-b border-industrial-800 flex justify-between items-center bg-industrial-950/50">
                  <h2 className="text-xl font-bold text-white">Procurement & Bid History</h2>
               </div>
               <HistoryTable role="company-buyer" />
            </div>

         </div>

         {/* Right Column: Handshake, SLAs */}
         <div className="space-y-8">
            
            {/* Digital Handshake / Pending Deliveries */}
            <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
               <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                 <Truck size={20} className="text-blue-500" /> Pending Deliveries
               </h2>
               <p className="text-xs text-industrial-400 mb-6">Confirm receipt of bulk waste from factories to finalize agreements and trigger Green Certificates.</p>
               
               <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                     <div className="flex justify-between items-start mb-3">
                        <div>
                           <h4 className="font-bold text-white">Cotton Offcuts (500kg)</h4>
                           <p className="text-xs text-industrial-400 mt-1">From: EcoRecycle Pvt Ltd</p>
                        </div>
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">In Transit</span>
                     </div>
                     <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20">
                        <CheckCircle size={16} /> Confirm Receipt
                     </button>
                  </div>
               </div>
            </div>

            {/* Compliance & SLAs */}
            <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <FileSignature size={20} className="text-nature-500" /> Compliance & SLAs
                  </h2>
                  <span className="bg-nature-500/10 text-nature-400 text-xs font-bold px-2 py-1 rounded-md border border-nature-500/20">2 Active</span>
               </div>
               
               <div className="space-y-4">
                  <div className="group cursor-pointer p-4 rounded-xl border border-industrial-800 bg-industrial-950/50 hover:border-nature-500/50 transition-colors">
                     <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white text-sm font-bold truncate">Monthly Polyester Supply</h4>
                        <span className="text-nature-400 text-xs font-bold">TexFab Lanka</span>
                     </div>
                     <p className="text-xs text-industrial-500">Agreement valid until Dec 2025. 1.5 Tonnes/mo.</p>
                  </div>
                  <div className="group cursor-pointer p-4 rounded-xl border border-industrial-800 bg-industrial-950/50 hover:border-nature-500/50 transition-colors">
                     <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white text-sm font-bold truncate">Q4 Denim Offcuts</h4>
                        <span className="text-nature-400 text-xs font-bold">Global Fibers</span>
                     </div>
                     <p className="text-xs text-industrial-500">Fulfillment in progress. Next pickup: Oct 28.</p>
                  </div>
               </div>
            </div>

         </div>
      </div>

      {selectedItem && (
        <BidModal 
          isOpen={true} 
          onClose={() => setSelectedItem(null)} 
          item={selectedItem} 
          onPlaceBid={(amount) => {
            console.log(`Bid of ${amount} placed on ${selectedItem.title}`);
            // Logic handled by backend later
          }}
        />
      )}
    </div>
  );
}
