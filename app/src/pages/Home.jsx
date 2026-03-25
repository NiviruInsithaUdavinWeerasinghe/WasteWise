import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Truck, BarChart3 } from 'lucide-react';
import AuctionCard from '../components/AuctionCard';
import BidModal from '../components/BidModal';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { getOptimizedUrl } from '../services/cloudinaryService';

export default function Home({ onOpenUpload }) {
  const [selectedBidItem, setSelectedBidItem] = useState(null);
  const { user } = useAuth();

  const [auctions, setAuctions] = useState([]);

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
    <div className="min-h-screen bg-industrial-950 font-sans text-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-industrial-900 pt-32 pb-32 lg:pt-40 lg:pb-40">
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-nature-500 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-teal-600 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-white/10 text-nature-300 font-medium text-sm mb-6 border border-white/10 backdrop-blur-sm">
              Sri Lanka's 1st Industrial Waste Marketplace
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
              Turn Factory Waste into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-nature-400 to-teal-400">Verified Revenue</span>
            </h1>
            <p className="text-lg md:text-xl text-industrial-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect directly with verified recyclers. Get AI-powered grading, fair pricing, and automated green compliance certificates in one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <a 
                  href="/dashboard"
                  className="w-full sm:w-auto px-8 py-4 bg-nature-600 hover:bg-nature-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-nature-500/30 flex items-center justify-center gap-2"
                >
                  Go to Dashboard <ArrowRight size={20} />
                </a>
              ) : (
                <a 
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-nature-600 hover:bg-nature-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-nature-500/30 flex items-center justify-center gap-2"
                >
                  Join Now <ArrowRight size={20} />
                </a>
              )}
              <a href="/marketplace" className="inline-flex items-center w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold backdrop-blur-md transition-all border border-white/10 justify-center">
                Browse Marketplace
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats / Trust */}
      <section className="bg-industrial-900 py-12 border-y border-industrial-800">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-industrial-800">
            <div>
               <div className="text-4xl font-bold text-nature-600 mb-1">500+</div>
               <div className="text-sm text-industrial-400 font-medium">Factories Registered</div>
            </div>
            <div>
               <div className="text-4xl font-bold text-nature-600 mb-1">12kT</div>
               <div className="text-sm text-industrial-400 font-medium">Waste Diverted</div>
            </div>
            <div>
               <div className="text-4xl font-bold text-nature-600 mb-1">Rs 45M</div>
               <div className="text-sm text-industrial-400 font-medium">Value Generated</div>
            </div>
            <div>
               <div className="text-4xl font-bold text-nature-600 mb-1">100%</div>
               <div className="text-sm text-industrial-400 font-medium">Compliance Rate</div>
            </div>
         </div>
      </section>

      {/* Featured Auctions */}
      {user && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
             <div>
                <h2 className="text-3xl font-bold text-white mb-3">Live Material Auctions</h2>
                <p className="text-industrial-400">Bid on verified bulk materials from certified factories.</p>
             </div>
             <button className="hidden md:flex items-center gap-2 text-nature-400 font-medium hover:text-nature-300">
               View All Listings <ArrowRight size={18} />
             </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {auctions.map(item => (
               <AuctionCard 
                 key={item.id} 
                 {...item} 
                 onBid={() => setSelectedBidItem(item)}
               />
             ))}
          </div>
          
          <button className="w-full md:hidden mt-8 py-3 bg-industrial-800 border border-industrial-700 rounded-lg text-industrial-300 font-medium">
               View All Listings
          </button>
        </section>
      )}

      {/* Value Props */}
      <section className="py-20 bg-industrial-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Industry Leaders Choose WasteWise</h2>
              <p className="text-industrial-400">We solve the transparency gap in industrial recycling.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                 <div className="w-12 h-12 bg-nature-500/20 rounded-lg flex items-center justify-center text-nature-400 mb-6">
                    <ShieldCheck size={28} />
                 </div>
                 <h3 className="text-xl font-bold mb-3">Green Certificates</h3>
                 <p className="text-industrial-400 leading-relaxed">
                   Automatically generate audit-proof recycling documentation for every transaction. 
                   Essential for EU/US export compliance.
                 </p>
              </div>
              <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                 <div className="w-12 h-12 bg-nature-500/20 rounded-lg flex items-center justify-center text-nature-400 mb-6">
                    <BarChart3 size={28} />
                 </div>
                 <h3 className="text-xl font-bold mb-3">Fair Market Value</h3>
                 <p className="text-industrial-400 leading-relaxed">
                   Our ML algorithms analyze global scrap prices and local demand to suggest 
                   optimal pricing for your specific material type.
                 </p>
              </div>
              <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                 <div className="w-12 h-12 bg-nature-500/20 rounded-lg flex items-center justify-center text-nature-400 mb-6">
                    <Truck size={28} />
                 </div>
                 <h3 className="text-xl font-bold mb-3">Verified Logisitics</h3>
                 <p className="text-industrial-400 leading-relaxed">
                   Connect with vetted haulers who specialize in industrial waste. 
                   Track pickups and ensure responsible disposal.
                 </p>
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
