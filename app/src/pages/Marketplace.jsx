import React, { useState, useEffect } from 'react';
import AuctionCard from '../components/AuctionCard';
import BidModal from '../components/BidModal';
import { Search, Filter, Loader } from 'lucide-react';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBidItem, setSelectedBidItem] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/listings');
        if (response.ok) {
          const data = await response.json();
          const formattedItems = data.map(listing => ({
            id: listing._id,
            title: `${listing.condition} ${listing.wasteType} - ${listing.location}`,
            weight: `${listing.weight} kg`,
            currentBid: listing.sellingMethod === 'auction' ? `${listing.startingBid?.toLocaleString()} LKR` : `${listing.price?.toLocaleString()} LKR`,
            timeEnds: listing.sellingMethod === 'auction' ? "Active Bidding" : "Direct Sale",
            type: listing.wasteType,
            // Random default image for now as image upload to cloud storage isn't built yet
            image: "https://images.unsplash.com/photo-1604937455095-ef2fe3d46fcd?auto=format&fit=crop&q=80&w=800",
            sellingMethod: listing.sellingMethod
          }));
          setItems(formattedItems);
        }
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handlePlaceBid = (amount) => {
    // Note: To make bidding real, we would POST to an /api/listings/:id/bid endpoint here
    setItems(items.map(item => 
       item.id === selectedBidItem.id 
       ? { ...item, currentBid: `${parseInt(amount).toLocaleString()} LKR` } 
       : item
    ));
  };

  const filteredItems = items.filter(i => 
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-industrial-900">Waste Marketplace</h1>
           <p className="text-industrial-500">Live auctions and direct sales from certified factories.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder="Search materials..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-industrial-200 rounded-lg focus:ring-2 focus:ring-nature-500 outline-none"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-400" />
           </div>
           <button className="px-4 py-2.5 bg-white border border-industrial-200 rounded-lg text-industrial-600 hover:bg-industrial-50">
             <Filter size={20} />
           </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="animate-spin text-nature-500" size={48} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 text-industrial-500 bg-white rounded-xl border border-industrial-100">
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
