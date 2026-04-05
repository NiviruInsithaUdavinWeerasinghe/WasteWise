import React, { useState, useEffect, useMemo } from 'react';
import DashboardChart from '../components/DashboardChart.jsx';
import HistoryTable from '../components/HistoryTable.jsx';
import { Upload, Leaf, DollarSign, AlertTriangle, FileSignature, CloudRain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ContractNegotiation from '../components/ContractNegotiation.jsx';
import ProposeContractModal from '../components/ProposeContractModal.jsx';
import StatCard from '../components/StatCard.jsx';
import { API_BASE_URL } from '../config/api';

export default function SellerDashboard({ onOpenUpload }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalWeight: 0,
    revenue: 0,
    activeListings: 0
  });
  const [rawListings, setRawListings] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [slaTab, setSlaTab] = useState('long-term');
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [auctionSlas, setAuctionSlas] = useState([]);
  const [showProposeModal, setShowProposeModal] = useState(false);

  useEffect(() => {
    const fetchSellerStats = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/listings/seller/${user.id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });

        if (response.ok) {
          const listings = await response.json();
          setRawListings(listings);
          
          let weight = 0;
          let rev = 0;
          let active = 0;
          let awaiting = 0;

          listings.forEach(listing => {
            let finalPrice = listing.price || listing.startingBid || 0;
            if (listing.sellingMethod === 'auction' && listing.bids && listing.bids.length > 0) {
              finalPrice = Math.max(...listing.bids.map(b => b.amount));
            }

            if (['sold', 'paid', 'completed'].includes(listing.status)) {
              weight += listing.weight || 0;
              rev += finalPrice;
            } else if (listing.status === 'active') {
              active += 1;
            } else if (listing.status === 'pending_payment') {
              const amount = finalPrice * 0.97;
              awaiting += amount;
            }
          });

          setStats({
            totalWeight: weight,
            revenue: rev,
            activeListings: active,
            awaitingPayment: awaiting,
            carbonSaved: weight * 15.6
          });
        }
      } catch (error) {
        console.error("Failed to fetch seller listings:", error);
      }
    };

    fetchSellerStats();
  }, [user]);

  const fetchContractsAndSLAs = async () => {
    try {
      const cRes = await fetch(`${API_BASE_URL}/contracts/my-contracts`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (cRes.ok) setContracts(await cRes.json());

      const slas = rawListings.filter(item => ['sold', 'paid', 'completed'].includes(item.status));
      setAuctionSlas(slas);
    } catch (error) {
      console.error("Failed to fetch contracts:", error);
    }
  };

  useEffect(() => {
    if (user?.id && rawListings.length > 0) {
      fetchContractsAndSLAs();
    }
  }, [user, rawListings]);

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    
    // Generate last 7 days template
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        dateStr: d.toDateString(),
        label: i === 0 ? 'Today' : days[d.getDay()],
        waste: 0,
        revenue: 0
      });
    }

    // Populate with real listing data
    rawListings.forEach(listing => {
      const createdDate = new Date(listing.createdAt).toDateString();
      const dayEntry = last7Days.find(d => d.dateStr === createdDate);
      
      if (dayEntry) {
        dayEntry.waste += listing.weight || 0;
        
        let finalPrice = listing.price || listing.startingBid || 0;
        if (listing.sellingMethod === 'auction' && listing.bids && listing.bids.length > 0) {
          finalPrice = Math.max(...listing.bids.map(b => b.amount));
        }
        
        if (['sold', 'paid', 'completed', 'pending_payment'].includes(listing.status)) {
           dayEntry.revenue += finalPrice;
        }
      }
    });

    return last7Days;
  }, [rawListings]);

  return (
    <div className="space-y-4">
      {!user?.isApproved && (
         <div className="bg-orange-500/10 border border-orange-500/50 rounded-xl p-6 mb-6 flex items-start gap-4">
            <AlertTriangle className="text-orange-500 shrink-0 mt-1" size={24} />
            <div>
               <h3 className="text-orange-600 font-bold text-lg mb-1">Account pending admin approval</h3>
               <p className="text-orange-700/80 text-sm">Your factory registration is currently under review by the platform administrators. You can explore the dashboard, but you will not be able to upload new waste listings or generate certificates until your Business Registration (BR) is verified.</p>
            </div>
         </div>
      )}

      {/* Action Bar */}
      <div className="bg-gradient-to-r from-nature-800 to-nature-600 rounded-2xl p-8 text-white flex flex-col md:flex-row justify-between items-center shadow-lg shadow-nature-900/20">
         <div>
           <h2 className="text-3xl font-bold mb-2">Factory Waste Management</h2>
           <p className="text-nature-100 max-w-xl">Upload your daily fabric cut-offs to generate Green Certificates and revenue.</p>
         </div>
         <button 
           onClick={onOpenUpload}
           disabled={!user?.isApproved}
           className={`mt-6 md:mt-0 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-xl ${
             !user?.isApproved 
             ? 'bg-white/20 text-white/50 cursor-not-allowed border border-white/20'
             : 'bg-white text-nature-700 hover:bg-nature-50'
           }`}
         >
           <Upload size={20} /> Upload Waste
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          index={0}
          isSplit={true}
          icon={Leaf}
          label="Waste Diverted"
          value={stats.totalWeight.toLocaleString()}
          subValue="Total completed"
          color="nature"
          secondHalf={{
            icon: CloudRain,
            label: "Carbon Emissions Saved",
            value: (stats.carbonSaved || 0) >= 1000
              ? `${((stats.carbonSaved || 0) / 1000).toFixed(2)} t`
              : `${(stats.carbonSaved || 0).toFixed(1)} kg`
          }}
        />
        
        <StatCard 
          index={1}
          icon={DollarSign}
          label="Revenue Generated"
          value={`Rs ${stats.revenue.toLocaleString()}`}
          color="blue"
        />

        <StatCard 
          index={2}
          icon={DollarSign}
          label="Awaiting Payment"
          value={`Rs ${(stats.awaitingPayment || 0).toLocaleString()}`}
          subValue="Expected net payout (-3%)"
          color="yellow"
        />

        <StatCard 
          index={3}
          icon={Upload}
          label="Active Listings"
          value={stats.activeListings}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-industrial-900 rounded-xl border border-industrial-800 shadow-lg flex flex-col self-start w-full">
           <div className="overflow-y-auto overflow-x-hidden custom-scrollbar max-h-[500px]">
             <HistoryTable 
               role="seller" 
               data={showAll ? rawListings : rawListings.slice(0, 5)} 
               title="Your Uploads" 
               onViewAll={null}
               isShowingAll={showAll}
               totalItems={rawListings.length}
             />
           </div>
           {rawListings.length >= 3 && (
             <div className="p-4 border-t border-industrial-800 bg-industrial-950/30 text-center shrink-0">
               <button
                 onClick={() => setShowAll(!showAll)}
                 className="text-sm font-bold text-nature-500 hover:text-nature-400 transition-colors py-2 px-6 rounded-xl hover:bg-nature-500/10 active:scale-95"
               >
                 {showAll ? 'Show Less' : `View All Your Uploads \u2192`}
               </button>
             </div>
           )}
        </div>
         <div className="lg:col-span-1 flex flex-col space-y-6">
            <DashboardChart 
              title="Weekly Performance" 
              data={chartData}
              series1Name="Waste (kg)"
              series2Name="Revenue (Rs)"
              series1Key="waste"
              series2Key="revenue"
            />
           
           {/* Contracts & SLAs Section */}
            <div className="bg-industrial-900 p-6 rounded-xl shadow-lg border border-industrial-800">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <FileSignature size={20} className="text-nature-500" /> Contracts & SLAs
                  </h2>
                  <button
                    onClick={() => setShowProposeModal(true)}
                    className="text-xs font-bold text-nature-500 hover:text-nature-400 bg-nature-500/10 hover:bg-nature-500/20 border border-nature-500/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <FileSignature size={12} /> Propose Contract
                  </button>
               </div>
               
               <div className="flex gap-4 mb-6 border-b border-industrial-800">
                  <button 
                    onClick={() => setSlaTab('long-term')}
                    className={`pb-2 text-xs font-bold transition-colors border-b-2 ${slaTab === 'long-term' ? 'border-nature-500 text-nature-500' : 'border-transparent text-industrial-500'}`}
                  >
                    Long-Term Contracts
                  </button>
                  <button 
                    onClick={() => setSlaTab('auctions')}
                    className={`pb-2 text-xs font-bold transition-colors border-b-2 ${slaTab === 'auctions' ? 'border-nature-500 text-nature-500' : 'border-transparent text-industrial-500'}`}
                  >
                    Auction SLAs
                  </button>
               </div>

               <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {slaTab === 'long-term' ? (
                    contracts.length > 0 ? (
                      contracts.map(c => (
                        <div 
                          key={c._id} 
                          onClick={() => { setSelectedContractId(c._id); setShowContractModal(true); }}
                          className="group cursor-pointer p-4 rounded-xl border border-industrial-800 bg-industrial-950/50 hover:border-nature-500/50 transition-colors"
                        >
                           <div className="flex justify-between items-center mb-1">
                              <h4 className="text-white text-sm font-bold truncate">{c.wasteType} Supply</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                c.status === 'active' 
                                  ? 'bg-nature-500/10 text-nature-400 border-nature-500/20' 
                                  : (c.buyerSignatureUrl && c.sellerSignatureUrl)
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-industrial-800 text-industrial-500 border-industrial-700'
                              }`}>
                                {(c.buyerSignatureUrl && c.sellerSignatureUrl && c.status !== 'active') ? 'READY TO ESTABLISH' : c.status.toUpperCase()}
                              </span>
                           </div>
                           <p className="text-xs text-industrial-500">{c.monthlyQuantityKg}kg/mo &bull; {c.durationMonths}mo</p>
                           {c.status === 'active' && (
                             <a 
                               href={`${API_BASE_URL}/contracts/${c._id}/download?token=${user.token}`} 
                               onClick={(e) => e.stopPropagation()}
                               className="text-[10px] font-bold text-nature-500 hover:text-nature-400 flex items-center gap-1 mt-2"
                             >
                               <FileSignature size={12} /> Download PDF
                             </a>
                           )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-industrial-500 text-xs">No long-term contracts found.</p>
                    )
                  ) : (
                    auctionSlas.length > 0 ? (
                      auctionSlas.map(sla => (
                        <div key={sla._id} className="p-4 rounded-xl border border-industrial-800 bg-industrial-950/50">
                           <div className="flex justify-between items-center mb-1">
                              <h4 className="text-white text-sm font-bold truncate">{sla.wasteType}</h4>
                              <span className="text-nature-400 text-xs font-bold">{sla.weight}kg</span>
                           </div>
                           <a 
                             href={`${API_BASE_URL}/agreements/${sla._id}/download?token=${user.token}`}
                             className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                           >
                             <FileSignature size={12} /> Download Trade Agreement (PDF)
                           </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-8 text-industrial-500 text-xs">No auction SLAs found.</p>
                    )
                  )}
               </div>
            </div>
        </div>
      </div>

      <ContractNegotiation 
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        contractId={selectedContractId}
        onUpdate={fetchContractsAndSLAs}
      />

      <ProposeContractModal
        isOpen={showProposeModal}
        onClose={() => setShowProposeModal(false)}
        onSuccess={fetchContractsAndSLAs}
      />
    </div>
  );
}
