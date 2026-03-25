import React, { useState, useEffect } from 'react';
import AuctionCard from '../components/AuctionCard';
import BidModal from '../components/BidModal';
import { Search, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getOptimizedUrl } from '../services/cloudinaryService';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBidItem, setSelectedBidItem] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  const getMaterialImage = (type) => {
    const t = type.toLowerCase();
    if (t.includes('plastic')) return "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&q=80&w=800";
    if (t.includes('paper') || t.includes('cardboard')) return "https://images.unsplash.com/photo-1603504381273-df13b2c159fb?auto=format&fit=crop&q=80&w=800";
    if (t.includes('metal') || t.includes('steel') || t.includes('iron')) return "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=800";
    if (t.includes('glass')) return "https://images.unsplash.com/photo-1514222045585-64d88e632831?auto=format&fit=crop&q=80&w=800";
    if (t.includes('electronic') || t.includes('e-waste')) return "https://images.unsplash.com/photo-1550005973-54cac8ed9d27?auto=format&fit=crop&q=80&w=800";
    if (t.includes('fabric') || t.includes('textile') || t.includes('cotton') || t.includes('denim')) return "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800";
    if (t.includes('polyester')) return "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800";
    return "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800"; // fallback waste image
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

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/listings');
      if (response.ok) {
        const data = await response.json();
        const formattedItems = data.map(listing => {
          // Calculate max bid if there are bids
          const maxBid = listing.bids?.length > 0 
            ? Math.max(...listing.bids.map(b => b.amount))
            : listing.startingBid || 0;

          return {
            id: listing._id,
            title: `${listing.condition} ${listing.wasteType} - ${listing.location}`,
            weight: `${listing.weight} kg`,
            currentBid: listing.sellingMethod === 'auction' ? `${maxBid.toLocaleString()} LKR` : `${listing.price?.toLocaleString()} LKR`,
            rawHighestBid: maxBid,
            bidsCount: listing.bids?.length || 0,
            realBids: listing.bids || [],
            timeEnds: listing.sellingMethod === 'auction' ? formatDeadline(listing.endTime) : "Direct Sale",
            isClosed: listing.sellingMethod === 'auction' ? (new Date(listing.endTime || new Date()) < new Date()) : false,
            type: listing.wasteType,
            condition: listing.condition,
            location: listing.location,
            sellerName: listing.sellerId?.name || 'Verified Source',
            sellerPhoto: listing.sellerId?.profilePhoto,
            image: listing.imageUrl ? getOptimizedUrl(listing.imageUrl) : getMaterialImage(listing.wasteType),
            sellingMethod: listing.sellingMethod,
            sellerId: listing.sellerId?._id || listing.sellerId,
            startingBid: listing.startingBid,
            description: listing.description,
            minBidIncrease: listing.minBidIncrease,
            endTime: listing.endTime
          };
        });
        setItems(formattedItems);
      }
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
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
        // Explicitly refresh in background, do NOT kill the modal here. The BidModal timeout handles its UI gracefully.
        await fetchListings();
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

  const filteredItems = items.filter(i => 
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-industrial-950 font-sans text-white selection:bg-nature-500/30 overflow-x-hidden relative">
      {/* Texture & Glow Background Overlays */}
      <div className="fixed inset-0 noise-overlay z-0" />
      <div className="fixed inset-0 mesh-gradient-industrial z-0 opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
             <h1 className="text-4xl font-bold text-white tracking-tight">Industrial Marketplace</h1>
             <p className="text-industrial-400 text-lg">Live auctions and direct sales from certified factories.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4 w-full md:w-auto"
          >
             <div className="relative flex-1 md:w-80">
                <input 
                  type="text" 
                  placeholder="Search materials, locations, types..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 glass-industrial rounded-2xl focus:ring-2 focus:ring-nature-500 outline-none text-white placeholder-industrial-500 transition-all"
                />
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-industrial-500" />
             </div>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 relative z-10">
            <Loader className="animate-spin text-nature-500" size={48} />
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 glass-industrial rounded-3xl relative z-10"
          >
             No active listings found in this sector.
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => (
                <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   transition={{ delay: idx * 0.05 }}
                >
                  <AuctionCard 
                     {...item} 
                     onBid={() => setSelectedBidItem(item)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {selectedBidItem && (
        <BidModal 
           isOpen={!!selectedBidItem} 
           item={selectedBidItem} 
           onClose={() => setSelectedBidItem(null)} 
           onPlaceBid={handlePlaceBid}
        />
      )}
    </div>
  );
}
