import React, { useState, useEffect } from 'react';
import AuctionCard from '../components/AuctionCard';
import BidModal from '../components/BidModal';
import { Search, Filter, Loader } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white">Waste Marketplace</h1>
           <p className="text-industrial-400">Live auctions and direct sales from certified factories.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="Search materials..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-industrial-900 border border-industrial-800 rounded-xl focus:ring-2 focus:ring-nature-500 outline-none text-white placeholder-industrial-500 shadow-inner"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-500" />
           </div>
           <button className="px-4 py-2.5 bg-industrial-900 border border-industrial-800 rounded-xl text-industrial-400 hover:bg-industrial-800 hover:text-white transition-colors shadow-sm">
             <Filter size={20} />
           </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="animate-spin text-nature-500" size={48} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 text-industrial-400 bg-industrial-900/50 rounded-2xl border border-industrial-800 shadow-inner">
           No active listings found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <AuctionCard 
               key={item.id} 
               {...item} 
               onBid={() => setSelectedBidItem(item)}
            />
          ))}
        </div>
      )}

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
