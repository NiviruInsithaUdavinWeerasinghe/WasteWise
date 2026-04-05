import React, { useState, useEffect } from 'react';
import HistoryTable from '../components/HistoryTable.jsx';
import AuctionCard from '../components/AuctionCard.jsx';
import { useAuth } from '../context/AuthContext';
import BidModal from '../components/BidModal.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
import { Package, TrendingUp, DollarSign, CloudRain, Star, Truck, CheckCircle, FileSignature, Info, Shield, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOptimizedUrl } from '../services/cloudinaryService';
import DeliveryDetailsModal from '../components/DeliveryDetailsModal.jsx';
import ContractNegotiation from '../components/ContractNegotiation.jsx';
import ProposeContractModal from '../components/ProposeContractModal.jsx';
import StatCard from '../components/StatCard.jsx';
import { API_BASE_URL } from '../config/api';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [logisticsError, setLogisticsError] = useState(null);
  const [paymentListingId, setPaymentListingId] = useState(null);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [slaTab, setSlaTab] = useState('long-term');
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [myBids, setMyBids] = useState({ active: [], participated: [], won: [], pending: [], paid: [] });
  const [auctionSlas, setAuctionSlas] = useState([]);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [buyerStats, setBuyerStats] = useState({ totalWeightTonnes: 0, totalBids: 0, totalContracts: 0, totalExpenditure: 0, co2OffsetKg: 0 });
  const [deliveryDetails, setDeliveryDetails] = useState(null);

  const formatDeadline = (endTime) => {
    if (!endTime) return "Ends Soon";
    const end = new Date(endTime);
    const now = new Date();
    const diffMs = end - now;
    if (diffMs <= 0) return "Closed";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `Ends Soon (${diffMins}m left)`;
    return end.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  const getMaterialImage = (type) => {
    const t = type.toLowerCase();
    if (t.includes('plastic')) return "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&q=80&w=800";
    if (t.includes('paper') || t.includes('cardboard')) return "https://images.unsplash.com/photo-1603504381273-df13b2c159fb?auto=format&fit=crop&q=80&w=800";
    if (t.includes('metal') || t.includes('steel') || t.includes('iron')) return "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=800";
    if (t.includes('glass')) return "https://images.unsplash.com/photo-1514222045585-64d88e632831?auto=format&fit=crop&q=80&w=800";
    if (t.includes('electronic') || t.includes('e-waste')) return "https://images.unsplash.com/photo-1550005973-54cac8ed9d27?auto=format&fit=crop&q=80&w=800";
    if (t.includes('fabric') || t.includes('textile') || t.includes('cotton') || t.includes('denim')) return "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800";
    if (t.includes('polyester')) return "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800";
    return "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800";
  };

  const fetchMyBids = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/listings/buyer/bids`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();

        const formattedItems = data.map(listing => {
          const maxBid = listing.bids?.length > 0
            ? Math.max(...listing.bids.map(b => b.amount))
            : listing.startingBid || 0;

          return {
            id: listing._id,
            status: listing.status,
            title: `${listing.condition} ${listing.wasteType} - ${listing.location}`,
            weight: `${listing.weight} kg`,
            currentBid: `${maxBid.toLocaleString()} LKR`,
            rawHighestBid: maxBid,
            timeEnds: listing.sellingMethod === 'auction' ? formatDeadline(listing.endTime) : "Direct Sale",
            isClosed: listing.sellingMethod === 'auction' ? (new Date(listing.endTime || new Date()) < new Date()) : false,
            endTime: listing.endTime,
            type: listing.wasteType,
            condition: listing.condition,
            location: listing.location,
            sellerName: listing.sellerId?.name || 'Verified Source',
            sellerPhoto: listing.sellerId?.profilePhoto,
            image: listing.imageUrl ? getOptimizedUrl(listing.imageUrl) : getMaterialImage(listing.wasteType),
            realBids: listing.bids,
            defaultedBids: listing.defaultedBids,
            startingBid: listing.startingBid,
            description: listing.description,
            pickupResponsibility: listing.pickupResponsibility,
            minBidIncrease: listing.minBidIncrease,
            isWinner: (listing.bids?.length > 0 && (['sold', 'pending_payment', 'paid'].includes(listing.status)))
              ? (() => {
                const highestBid = listing.bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
                const winnerId = highestBid.userId._id || highestBid.userId;
                return winnerId === user?.id;
              })()
              : false
          };
        });

        const active = formattedItems.filter(item => !item.isClosed && item.status === 'active');
        const participated = formattedItems.filter(item => item.isClosed || item.status !== 'active');
        const won = participated.filter(item => {
          if (['sold', 'pending_payment', 'paid', 'completed'].includes(item.status)) {
            if (!item.realBids || item.realBids.length === 0) return false;
            const highestBid = item.realBids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
            return highestBid.userId._id === user?.id || highestBid.userId === user?.id;
          }
          return false;
        });
        const pending = won.filter(item => item.status === 'pending_payment');
        const paid = won.filter(item => ['sold', 'paid', 'completed'].includes(item.status));
        const deliveries = won.filter(item => item.status === 'sold' || item.status === 'paid');

        setMyBids({ active, participated, won, pending, paid });
        setPendingDeliveries(deliveries);

        // Compute buyer stats from completed/paid won bids
        const completedWon = formattedItems.filter(item =>
          ['sold', 'paid', 'completed'].includes(item.status) &&
          (() => {
            if (!item.realBids || item.realBids.length === 0) return false;
            const highestBid = item.realBids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
            const winnerId = highestBid.userId?._id || highestBid.userId;
            return winnerId === user?.id;
          })()
        );
        const totalWeightKg = completedWon.reduce((sum, item) => {
          const kg = parseFloat((item.weight || '0').toString().replace(/[^0-9.]/g, ''));
          return sum + (isNaN(kg) ? 0 : kg);
        }, 0);
        const totalExpenditure = completedWon.reduce((sum, item) => sum + (item.rawHighestBid || 0), 0);
        const totalBids = formattedItems.length;
        const co2OffsetKg = totalWeightKg * 15.6;
        setBuyerStats(prev => ({
          ...prev,
          totalWeightTonnes: totalWeightKg / 1000,
          totalBids: totalBids,
          totalExpenditure,
          co2OffsetKg
        }));
      }
    } catch (error) {
      console.error("Failed to fetch bids:", error);
    }
  };

  const fetchContractsAndSLAs = async () => {
    try {
      // Fetch Long-term Contracts
      const cRes = await fetch(`${API_BASE_URL}/contracts/my-contracts`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (cRes.ok) setContracts(await cRes.ok ? await cRes.json() : []);

      // Filter Auction SLAs from paid/completed bids
      const slas = myBids.paid.filter(item => ['sold', 'paid', 'completed'].includes(item.status));
      setAuctionSlas(slas);
    } catch (error) {
      console.error("Failed to fetch contracts:", error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMyBids();
    }
  }, [user]);

  useEffect(() => {
    if (user?.id && myBids.paid) {
      fetchContractsAndSLAs();
      // Update contract count in stats once contracts are loaded
    }
  }, [user, myBids.paid]);

  // Update bids+contracts stat after contracts load
  useEffect(() => {
    setBuyerStats(prev => ({
      ...prev,
      totalContracts: contracts?.length || 0
    }));
  }, [contracts]);

  const handlePlaceBid = async (amount) => {
    try {
      const response = await fetch(`${API_BASE_URL}/listings/${selectedItem.id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ amount: Number(amount) })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchMyBids();
        return true;
      } else {
        alert(data.message || 'Failed to place bid');
        throw new Error(data.message || 'Failed to place bid');
      }
    } catch (error) {
      console.error("Bid error:", error);
      alert(error.message || 'An error occurred while placing your bid.');
      throw error;
    }
  };

  const initiatePayment = async (listing) => {
    setPaymentListingId(listing.id);
    setPaymentAmount(listing.rawHighestBid || Number(listing.currentBid.replace(/[^0-9.]/g, '')));
    setDeliveryFee(0);
    setLogisticsError(null);
    setShowPaymentModal(true);

    // Fetch delivery fee if applicable
    try {
      const response = await fetch(`${API_BASE_URL}/listings/${listing.id}/delivery-fee`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setDeliveryFee(data.deliveryFee || 0);
        setDeliveryDetails(data);
      } else if (data.isLogisticsError) {
        setLogisticsError(data.error || data.message);
      }
    } catch (err) {
      console.error("Error fetching delivery fee:", err);
    }
  };

  const handlePayment = async (listingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/listings/${listingId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        fetchMyBids();
      } else {
        alert(data.message || 'Payment failed');
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert('An error occurred during payment.');
    }
  };

  const handleConfirmReceipt = async (listingId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/listings/${listingId}/confirm-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        fetchMyBids();
      } else {
        console.error('Failed to confirm receipt:', data.message);
      }
    } catch (error) {
      console.error("Confirm receipt error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Verification Badge */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Procurement Dashboard</h1>
          <p className="text-industrial-400">Manage bulk waste procurement, active contracts, and digital trade agreements.</p>
        </div>
        {(() => {
          const kg = buyerStats.totalWeightTonnes * 1000;
          const tiers = [
            { threshold: 50000, name: "Quantum Resource Overlord", sub: "Global Sustainability Benchmark", color: "from-white via-industrial-100 to-industrial-300", icon: Shield, glow: "shadow-white/20", border: "border-white/40", text: "text-industrial-950", bg: "bg-white", bar: "bg-industrial-900" },
            { threshold: 25000, name: "Titanium Industrial Visionary", sub: "Resource Optimization Elite", color: "from-zinc-400 via-zinc-200 to-zinc-500", icon: Trophy, glow: "shadow-zinc-500/30", border: "border-zinc-400/30", text: "text-zinc-100", bg: "bg-zinc-900", bar: "bg-zinc-400" },
            { threshold: 10000, name: "Diamond Resource Guardian", sub: "Master of Circular Economy", color: "from-cyan-400 via-blue-300 to-indigo-400", icon: Star, glow: "shadow-cyan-500/40", border: "border-cyan-400/30", text: "text-cyan-100", bg: "bg-cyan-950", bar: "bg-cyan-400" },
            { threshold: 5000, name: "Platinum Circularity Champion", sub: "Superior Efficiency Partner", color: "from-slate-300 via-slate-100 to-slate-400", icon: CheckCircle, glow: "shadow-slate-400/20", border: "border-slate-300/30", text: "text-slate-200", bg: "bg-slate-900", bar: "bg-slate-300" },
            { threshold: 2500, name: "Gold Sustainability Leader", sub: "Premium Ecological Contributor", color: "from-amber-400 via-yellow-200 to-amber-600", icon: Star, glow: "shadow-amber-500/30", border: "border-amber-400/30", text: "text-amber-100", bg: "bg-amber-950", bar: "bg-amber-400" },
            { threshold: 1000, name: "Silver Sustainability Partner", sub: "Verified Eco-Systems Member", color: "from-industrial-300 via-industrial-100 to-industrial-400", icon: Shield, glow: "shadow-industrial-400/20", border: "border-industrial-300/30", text: "text-industrial-200", bg: "bg-industrial-800", bar: "bg-industrial-300" },
            { threshold: 600, name: "Eco-Warrior Status", sub: "Active Combatant of Industrial Waste", color: "from-purple-600 via-purple-400 to-purple-800", icon: Zap, glow: "shadow-purple-500/20", border: "border-purple-500/20", text: "text-purple-100", bg: "bg-purple-950", bar: "bg-purple-500" },
            { threshold: 300, name: "Sustainability Scout", sub: "Progressive Resource Manager", color: "from-blue-600 via-blue-400 to-blue-800", icon: TrendingUp, glow: "shadow-blue-500/20", border: "border-blue-500/20", text: "text-blue-100", bg: "bg-blue-950", bar: "bg-blue-500" },
            { threshold: 100, name: "Green Initiate", sub: "Developing Circular Habitats", color: "from-nature-600 via-nature-400 to-nature-800", icon: Package, glow: "shadow-nature-500/20", border: "border-nature-500/20", text: "text-nature-100", bg: "bg-nature-950", bar: "bg-nature-500" },
            { threshold: 0, name: "Novice Recycler", sub: "Beginning The Circular Journey", color: "from-industrial-600 via-industrial-400 to-industrial-700", icon: Package, glow: "shadow-industrial-500/10", border: "border-industrial-700", text: "text-industrial-400", bg: "bg-industrial-900", bar: "bg-industrial-600" }
          ];

          const currentTierIndex = tiers.findIndex(t => kg >= t.threshold);
          const currentTier = tiers[currentTierIndex];
          const nextTier = tiers[currentTierIndex - 1];
          const progress = nextTier ? ((kg - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100 : 100;
          const TierIcon = currentTier.icon;

          return (
            <motion.div 
              whileHover={{ scale: 1.02, translateY: -2 }}
              className="relative group cursor-help"
            >
              {/* Animated Background Dynamic Glow */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${currentTier.color} rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-700`}></div>
              
              <div className={`relative ${currentTier.bg}/90 backdrop-blur-2xl p-5 rounded-2xl border ${currentTier.border} flex items-center gap-5 shadow-2xl min-w-[340px] overflow-hidden`}>
                {/* Background Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                
                {/* Tier Badge Icon */}
                <div className={`relative p-3.5 rounded-2xl shadow-lg border transition-all duration-700 ${currentTier.bg} ${currentTier.border} ${currentTier.text} ${currentTier.glow}`}>
                  <motion.div
                    animate={kg >= 5000 ? {
                      rotate: [0, 5, -5, 5, 0],
                      scale: [1, 1.05, 1],
                      filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                    } : {}}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <TierIcon size={28} strokeWidth={2.5} fill={kg >= 2500 ? "currentColor" : "none"} />
                  </motion.div>
                  {/* Rank Indicator Badge */}
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border tracking-tighter ${currentTier.bg} ${currentTier.border} ${currentTier.text}`}>
                    {10 - currentTierIndex}
                  </div>
                </div>
                
                <div className="flex-1 relative">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h2 className={`text-[13px] font-black uppercase tracking-[0.1em] ${currentTier.text}`}>
                      {currentTier.name}
                    </h2>
                  </div>
                  <p className="text-[10px] font-medium text-industrial-400 tracking-wide mb-3 opacity-80 italic">
                    {currentTier.sub}
                  </p>
                  
                  {/* Multi-Tier Progress Tracking */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-industrial-500">
                      <span>Exp: {kg.toLocaleString()} units</span>
                      {nextTier && <span className="text-industrial-300">Next: {nextTier.threshold >= 1000 ? `${(nextTier.threshold/1000).toFixed(1)}t` : `${nextTier.threshold}kg`}</span>}
                    </div>
                    
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${currentTier.color} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                      />
                    </div>
                    
                    {nextTier && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1 h-1 rounded-full bg-nature-500 animate-pulse"></div>
                        <p className="text-[8px] font-bold text-industrial-400 tracking-wider">
                          {nextTier.threshold >= 1000 
                            ? `${(nextTier.threshold - kg / 1000).toFixed(2)} tonnes until ${nextTier.name.split(' ')[0]}`
                            : `${(nextTier.threshold - kg).toFixed(0)} units until evolution`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          index={0}
          icon={Package}
          label="Bulk Waste Procured"
          value={buyerStats.totalWeightTonnes < 1
            ? `${(buyerStats.totalWeightTonnes * 1000).toFixed(0)} kg`
            : `${buyerStats.totalWeightTonnes.toFixed(2)} Tonnes`}
          color="nature"
        />

        <StatCard
          index={1}
          icon={TrendingUp}
          label="Auction Bids"
          value={buyerStats.totalBids}
          subValue="Total participated"
          color="orange"
        />

        <StatCard
          index={2}
          icon={FileSignature}
          label="Contracts"
          value={buyerStats.totalContracts}
          subValue="Long-term SLAs"
          color="purple"
        />

        <StatCard
          index={3}
          icon={DollarSign}
          label="Total Expenditure"
          value={buyerStats.totalExpenditure >= 1_000_000
            ? `${(buyerStats.totalExpenditure / 1_000_000).toFixed(1)}M LKR`
            : buyerStats.totalExpenditure >= 1_000
              ? `${(buyerStats.totalExpenditure / 1_000).toFixed(1)}K LKR`
              : `${buyerStats.totalExpenditure.toLocaleString()} LKR`}
          color="blue"
        />

        <StatCard
          index={4}
          icon={CloudRain}
          label="Emissions Offset Aided"
          value={`${buyerStats.co2OffsetKg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg CO₂`}
          color="nature"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Ledger & Bids */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Bids */}
          <div className="bg-industrial-900 rounded-xl shadow-lg border border-industrial-800 overflow-hidden pt-6">
            <div className="px-6 mb-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Auctions & Bids</h2>
              <a href="/marketplace" className="text-sm font-bold text-nature-500 hover:text-nature-400 transition-colors py-2 px-4 rounded-xl hover:bg-nature-500/10">Browse Supply &rarr;</a>
            </div>

            <div className="px-6 mb-4 border-b border-industrial-800 flex gap-6 text-sm font-bold overflow-x-auto whitespace-nowrap custom-scrollbar">
              <button onClick={() => setActiveTab('active')} className={`pb-3 border-b-2 transition-colors ${activeTab === 'active' ? 'border-nature-500 text-nature-500' : 'border-transparent text-industrial-500 hover:text-industrial-300'}`}>Active ({myBids.active?.length || 0})</button>
              <button onClick={() => setActiveTab('pending')} className={`pb-3 border-b-2 transition-colors ${activeTab === 'pending' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-industrial-500 hover:text-industrial-300'}`}>Pending Payment ({myBids.pending?.length || 0})</button>
              <button onClick={() => setActiveTab('paid')} className={`pb-3 border-b-2 transition-colors ${activeTab === 'paid' ? 'border-blue-500 text-blue-500' : 'border-transparent text-industrial-500 hover:text-industrial-300'}`}>Paid ({myBids.paid?.length || 0})</button>
              <button onClick={() => setActiveTab('participated')} className={`pb-3 border-b-2 transition-colors ${activeTab === 'participated' ? 'border-nature-500 text-nature-500' : 'border-transparent text-industrial-500 hover:text-industrial-300'}`}>Participated ({myBids.participated?.length || 0})</button>
              <button onClick={() => setActiveTab('won')} className={`pb-3 border-b-2 transition-colors ${activeTab === 'won' ? 'border-nature-500 text-nature-500' : 'border-transparent text-industrial-500 hover:text-industrial-300'}`}>Won ({myBids.won?.length || 0})</button>
            </div>

            {myBids[activeTab]?.length > 0 ? (
              <div className={`p-6 bg-industrial-950/30 ${activeTab === 'active' ? 'flex gap-4 overflow-x-auto pb-4 custom-scrollbar' : 'flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar'}`}>
                {myBids[activeTab].map(b => (
                  activeTab === 'active' ? (
                    <AuctionCard
                      key={b.id}
                      {...b}
                      compact={true}
                      onBid={() => setSelectedItem(b)}
                    />
                  ) : (
                    <div
                      key={b.id}
                      className="bg-industrial-900 border border-industrial-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-nature-500/50 transition-colors cursor-pointer shadow-sm group"
                      onClick={() => setSelectedItem(b)}
                    >
                      <div className="flex flex-1 items-center gap-4 w-full md:w-auto overflow-hidden">
                        <img src={b.image} alt={b.title} className="w-16 h-16 rounded-xl object-cover border border-industrial-800 shrink-0 group-hover:border-nature-500/30 transition-colors" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-md truncate">{b.title}</h4>
                          <p className="text-sm text-industrial-400 truncate mt-0.5">{b.weight} &bull; {(() => {
                            const t = b.type || "";
                            const m = t.match(/^(.+?)\s*\((.+?)\)$/);
                            if (m && m[2].toLowerCase().startsWith(m[1].toLowerCase())) return m[2];
                            return t;
                          })()}</p>
                          <p className="text-xs text-industrial-500 truncate mt-0.5">Source: {b.sellerName}</p>
                        </div>
                      </div>
                      <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-industrial-800 shrink-0">
                        <div className="font-bold font-mono text-white text-lg">{b.currentBid}</div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full mt-1.5 border ${
                          b.status === 'completed' ? 'bg-nature-500/10 text-nature-400 border-nature-500/20' :
                          (b.status === 'pending_payment' && b.defaultedBids?.some(d => (d.userId?._id === user?.id || d.userId === user?.id))) ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          ['sold', 'paid'].includes(b.status) ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          b.status === 'pending_payment' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {
                            b.status === 'completed' ? 'Received' :
                            (b.status === 'pending_payment' && b.defaultedBids?.some(d => (d.userId?._id === user?.id || d.userId === user?.id))) ? 'Failed (Defaulted)' :
                            ['sold', 'paid'].includes(b.status) ? 'Paid' :
                            b.status === 'pending_payment' ? 'Pending Payment' :
                            'Closed'
                          }
                        </span>
                        {b.status === 'pending_payment' && b.isWinner && (
                          <button
                            onClick={(e) => { e.stopPropagation(); initiatePayment(b); }}
                            className="mt-3 w-full bg-nature-600 hover:bg-nature-500 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-lg"
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-industrial-950/30">
                <p className="text-industrial-400">No items in this category yet.</p>
              </div>
            )}
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

            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
              {pendingDeliveries.length > 0 ? (
                pendingDeliveries.map(listing => (
                  <div key={listing.id} className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-white truncate">{listing.title}</h4>
                        <p className="text-xs text-industrial-400 mt-1">From: {listing.sellerName}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 shrink-0">In Transit</span>
                    </div>
                    <button
                      onClick={() => setSelectedDelivery(listing)}
                      className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-sm font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 border border-blue-500/30 group-hover:border-blue-500/50 shadow-md"
                    >
                      <Info size={16} /> View Details
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border border-industrial-800 rounded-xl bg-industrial-950/30">
                  <p className="text-industrial-500 text-xs">No pending deliveries to confirm.</p>
                </div>
              )}
            </div>
          </div>

          {/* Contracts & SLAs */}
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

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {slaTab === 'long-term' ? (
                contracts.length > 0 ? (
                  contracts.map(c => (
                    <div
                      key={c._id}
                      onClick={() => { setSelectedContractId(c._id); setShowContractModal(true); }}
                      className="group cursor-pointer p-4 rounded-xl border border-industrial-800 bg-industrial-950/50 hover:border-nature-500/50 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white text-sm font-bold truncate">{c.wasteType} Supply</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${c.status === 'active' ? 'bg-nature-500/10 text-nature-400 border-nature-500/20' : 'bg-industrial-800 text-industrial-500 border-industrial-700'}`}>
                          {c.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-industrial-500">{c.monthlyQuantityKg}kg/mo &bull; {c.durationMonths} months</p>
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
                    <div key={sla.id} className="p-4 rounded-xl border border-industrial-800 bg-industrial-950/50">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-white text-sm font-bold truncate">{sla.title}</h4>
                        <span className="text-nature-400 text-xs font-bold">{sla.sellerName}</span>
                      </div>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `${API_BASE_URL}/agreements/${sla.id}/download`;
                          // Since we need auth, better use fetch and blob in HistoryTable, but for direct link:
                          window.open(`${API_BASE_URL}/agreements/${sla.id}/download?token=${user.token}`, '_blank');
                        }}
                        className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <FileSignature size={12} /> Download Trade Agreement (PDF)
                      </button>
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

      {selectedItem && (
        <BidModal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
          onPlaceBid={handlePlaceBid}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={paymentAmount}
          deliveryFee={deliveryFee}
          deliveryDetails={deliveryDetails}
          logisticsError={logisticsError}
          onSuccess={() => {
            setShowPaymentModal(false);
            handlePayment(paymentListingId);
          }}
        />
      )}

      <DeliveryDetailsModal
        isOpen={!!selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        delivery={selectedDelivery}
        onConfirmReceipt={handleConfirmReceipt}
      />

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
