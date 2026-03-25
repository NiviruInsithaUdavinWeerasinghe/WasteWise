import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, FileSignature, Gavel } from 'lucide-react';
import AuctionCard from '../components/AuctionCard';
import BidModal from '../components/BidModal';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { getOptimizedUrl } from '../services/cloudinaryService';

export default function Home({ onOpenUpload }) {
  const navigate = useNavigate();
  const [selectedBidItem, setSelectedBidItem] = useState(null);
  const { user } = useAuth();

  const [auctions, setAuctions] = useState([]);
  const [stats, setStats] = useState({
    totalFactories: 0,
    totalWasteDiverted: 0,
    totalValueGenerated: 0,
    complianceRate: 100
  });

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

  const fetchFeaturedAuctions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/listings');
      if (response.ok) {
        const data = await response.json();
        // Filter to only auctions, and take the top 3
        const auctionListings = data.filter(item => item.sellingMethod === 'auction').slice(0, 3);
        
        const formattedItems = auctionListings.map(listing => {
          const maxBid = listing.bids?.length > 0 
            ? Math.max(...listing.bids.map(b => b.amount))
            : listing.startingBid || 0;
            
          return {
            id: listing._id,
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
            image: listing.imageUrl ? getOptimizedUrl(listing.imageUrl) : getMaterialImage(listing.wasteType),
            realBids: listing.bids,
            startingBid: listing.startingBid,
            description: listing.description,
            minBidIncrease: listing.minBidIncrease
          };
        });
        setAuctions(formattedItems);
      }
    } catch (error) {
      console.error("Failed to fetch featured listings:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/listings/stats');
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (e) { console.error('Failed to fetch platform stats', e); }
  };

  const formatStats = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

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

  useEffect(() => {
    fetchFeaturedAuctions();
    fetchStats();
  }, []);

  const handlePlaceBid = async (amount) => {
    try {
      const response = await fetch(`http://localhost:5000/api/listings/${selectedBidItem.id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ amount: Number(amount) })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchFeaturedAuctions();
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

  return (
    <div className="min-h-screen bg-industrial-950 font-sans text-white selection:bg-nature-500/30 overflow-x-hidden relative">
      {/* Texture & Glow Background Overlays */}
      <div className="fixed inset-0 noise-overlay z-0" />
      <div className="fixed inset-0 mesh-gradient-industrial z-0 opacity-40" />
      
      {/* Hero Section 2.0 */}
      <section className="relative pt-20 pb-16 lg:pt-24 lg:pb-24 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Content */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nature-500/10 text-nature-400 font-semibold text-xs mb-6 border border-nature-500/20 backdrop-blur-md"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-nature-500 animate-pulse" />
                SRI LANKA'S INDUSTRIAL REVENUE CORE
              </motion.span>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-[1.1]">
                Turn Factory Waste into <br />
                <span className="text-glow-nature text-transparent bg-clip-text bg-gradient-to-r from-nature-400 to-teal-400">
                  Industrial Equity
                </span>
              </h1>
              
              <p className="text-xl text-industrial-300 mb-8 max-w-xl leading-relaxed">
                Connect directly with verified recyclers through our high-precision marketplace. 
                Experience AI-powered grading, automated green compliance, and secure logistics in a single, high-density industrial ecosystem.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {user ? (
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-full sm:w-auto px-10 py-4 bg-nature-600 hover:bg-nature-500 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-nature-500/40 flex items-center justify-center gap-2 group scale-100 hover:scale-105 active:scale-95"
                  >
                    Go to Dashboard <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/register')}
                    className="w-full sm:w-auto px-10 py-4 bg-nature-600 hover:bg-nature-500 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-nature-500/40 flex items-center justify-center gap-2 group scale-100 hover:scale-105 active:scale-95"
                  >
                    Join the Network <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
                {user?.role !== 'deliveryman' && (
                  <button 
                    onClick={() => navigate('/marketplace')}
                    className="w-full sm:w-auto px-10 py-4 glass-industrial hover:bg-white/10 text-white rounded-2xl font-bold transition-all justify-center items-center flex"
                  >
                    Browse Marketplace
                  </button>
                )}
              </div>
            </motion.div>

            {/* Right: Immersive Telemetry Panel */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative perspective-1000 hidden lg:block"
            >
              <div className="relative z-10 glass-nature rounded-[2.5rem] p-10 overflow-hidden group border-nature-500/20 shadow-2xl">
                 {/* Visual Asset with Dark Overlay */}
                 <div className="absolute inset-0 z-0">
                    <img 
                      src="/industrial_hero_2.png" 
                      alt="Industrial Core" 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-industrial-950/70 backdrop-blur-[2px]" />
                 </div>
                 
                 <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-start">
                       <div>
                          <h3 className="text-nature-400 font-black text-xs tracking-[0.3em] uppercase mb-2">Real-Time Logistics Hub</h3>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-nature-500 animate-pulse" />
                             <span className="text-[10px] text-industrial-300 font-mono">SECURE MATERIAL CHAIN</span>
                          </div>
                       </div>
                       <div className="px-3 py-1 rounded-lg bg-nature-500/10 text-[10px] font-black text-nature-400 border border-nature-500/30 backdrop-blur-md">VERIFIED</div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       {[
                         { label: "Active Factories", value: `${stats.totalFactories}+` },
                         { label: "Waste Diverted", value: `${formatStats(stats.totalWasteDiverted)}T` },
                         { label: "Value Generated", value: `Rs ${formatStats(stats.totalValueGenerated)}` },
                         { label: "Verified Compliance", value: `${stats.complianceRate}%` }
                       ].map((stat, i) => (
                         <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl group/card hover:bg-white/10 transition-colors">
                            <div className="text-3xl font-black text-white tracking-tighter drop-shadow-md mb-1">{stat.value}</div>
                            <div className="text-[10px] uppercase tracking-[0.1em] text-industrial-400 font-bold group-hover/card:text-nature-400 transition-colors">{stat.label}</div>
                         </div>
                       ))}
                    </div>
                    
                    {/* Simulated Chart/Wave Visual */}
                    <div className="space-y-4">
                       <div className="flex justify-between items-end px-1">
                          <span className="text-[9px] font-bold text-industrial-500 uppercase tracking-widest">Live Material Throughput</span>
                          <span className="text-[9px] font-bold text-nature-500/80">98.2% EFFICIENCY</span>
                       </div>
                       <div className="h-20 w-full bg-industrial-950/40 rounded-2xl border border-white/5 overflow-hidden flex items-end gap-1.5 px-6 py-4 backdrop-blur-md">
                          {[...Array(16)].map((_, i) => (
                            <motion.div 
                              key={i}
                              animate={{ height: [ 10, Math.random() * 40 + 10, 10 ] }}
                              transition={{ duration: 1.5 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
                              className="flex-1 bg-gradient-to-t from-nature-600/40 to-nature-400/20 rounded-full"
                            />
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Decorative Glows */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-nature-500/20 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-500/20 blur-[80px] rounded-full pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile Stats Bar (Simplified) */}
      <section className="lg:hidden border-y border-industrial-800 bg-industrial-900/50 py-8 px-4 relative z-10">
         <div className="grid grid-cols-2 gap-8 text-center">
            <div>
               <div className="text-2xl font-bold text-nature-400">{stats.totalFactories}+</div>
               <div className="text-[10px] text-industrial-500 font-bold uppercase tracking-widest">Factories</div>
            </div>
            <div>
               <div className="text-2xl font-bold text-nature-400">{formatStats(stats.totalWasteDiverted)}T</div>
               <div className="text-[10px] text-industrial-500 font-bold uppercase tracking-widest">Diverted</div>
            </div>
         </div>
      </section>

      {/* Live Auctions Section */}
      {user && user?.role !== 'deliveryman' && (
        <section className="relative py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6"
          >
             <div className="space-y-2">
                <h2 className="text-4xl font-bold text-white tracking-tight">Live Material Auctions</h2>
                <p className="text-industrial-400 text-lg">Bid on verified bulk materials from certified factories.</p>
             </div>
             <button 
               onClick={() => navigate('/marketplace')}
               className="group flex items-center gap-2 px-6 py-3 glass-industrial text-nature-400 font-bold rounded-xl hover:bg-white/10 transition-all"
             >
               View All Listings <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
             {auctions.map((item, idx) => (
               <motion.div
                 key={item.id}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: idx * 0.1 }}
               >
                 <AuctionCard 
                   {...item} 
                   onBid={() => setSelectedBidItem(item)}
                 />
               </motion.div>
             ))}
          </div>
          
          <button 
            onClick={() => navigate('/marketplace')}
            className="w-full md:hidden mt-12 py-4 glass-industrial rounded-2xl text-industrial-300 font-bold"
          >
               View All Listings
          </button>
        </section>
      )}

      {/* Value Propositions & Network Social Proof */}
      <section className="relative py-20 bg-industrial-950/50 z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-industrial-900/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 pt-20">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-center max-w-3xl mx-auto mb-12"
           >
              <h2 className="text-4xl font-bold mb-6 tracking-tight">Industrial Excellence Architecture</h2>
              <p className="text-industrial-400 text-lg">Our four-pillar approach to solving the transparency gap in industrial recycling.</p>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {[
                { 
                  icon: <ShieldCheck size={28} />, 
                  title: "Green Certificates", 
                  desc: "Automatically generate audit-proof recycling documentation for every transaction. Essential for global ESG and export compliance." 
                },
                { 
                  icon: <FileSignature size={28} />, 
                  title: "Trade Agreements", 
                  desc: "Legally binding SLAs are auto-generated upon payment, locking in pricing and pickup timelines for professional accountability." 
                },
                { 
                  icon: <Truck size={28} />, 
                  title: "Verified Logistics", 
                  desc: "Connect with vetted haulers who specialize in industrial waste. Track pickups via QR-secure handshakes and ensure safe disposal." 
                },
                { 
                  icon: <Gavel size={28} />, 
                  title: "Bulk Marketplace", 
                  desc: "Access factory-scale material auctions. Direct-from-source bulk waste at fair market prices through our competitive bidding system." 
                }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-industrial p-8 rounded-3xl hover:bg-white/10 transition-colors group"
                >
                   <div className="w-14 h-14 bg-nature-500/20 rounded-2xl flex items-center justify-center text-nature-400 mb-8 group-hover:bg-nature-500/30 transition-colors">
                      {feature.icon}
                   </div>
                   <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                   <p className="text-industrial-400 leading-relaxed text-sm">
                     {feature.desc}
                   </p>
                </motion.div>
              ))}
           </div>

           {/* Trusted By Section (Simplified Social Proof) */}
           <div className="border-t border-industrial-800 pt-10 mt-6">
              <div className="text-center mb-10">
                 <span className="text-[10px] font-bold tracking-[0.3em] text-industrial-500 uppercase">Sri Lanka's Certified Industrial Network</span>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all">
                 {/* Just using placeholder texts for a professional look if no logos available */}
                 <div className="text-xl font-black italic tracking-tighter">TEXTILE-CORP</div>
                 <div className="text-xl font-black italic tracking-tighter">METAL-GEN</div>
                 <div className="text-xl font-black italic tracking-tighter">POLY-SYNS</div>
                 <div className="text-xl font-black italic tracking-tighter">ECO-HAULERS</div>
                 <div className="text-xl font-black italic tracking-tighter">GRID-RECYCLE</div>
              </div>
           </div>
        </div>
      </section>

      {selectedBidItem && (
        <BidModal 
          isOpen={!!selectedBidItem} 
          item={selectedBidItem} 
          onClose={() => setSelectedBidItem(null)} 
          onPlaceBid={handlePlaceBid}
        />
      )}
    </div>
  )
}
