import React, { useState } from 'react';
import AuctionCard from '../components/AuctionCard';
import BidModal from '../components/BidModal';
import { Search, Filter } from 'lucide-react';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBidItem, setSelectedBidItem] = useState(null);

  // Mock Items
  const [items, setItems] = useState([
    {
      id: 1,
      title: "Sorted Cotton Offcuts - Mixed Colors",
      weight: "500 kg",
      currentBid: "45,000 LKR",
      timeEnds: "2h 15m",
      type: "Cotton",
      image: "https://images.unsplash.com/photo-1604937455095-ef2fe3d46fcd?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 2,
      title: "Polyester Rolls - Surplus Grade B",
      weight: "120 kg",
      currentBid: "18,500 LKR",
      timeEnds: "45m",
      type: "Polyester",
      image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 3,
      title: "Denim Scraps - High Density",
      weight: "1,200 kg",
      currentBid: "112,000 LKR",
      timeEnds: "5h 00m",
      type: "Denim",
      image: "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b2?auto=format&fit=crop&q=80&w=800"
    },
    {
       id: 4,
       title: "White Linen Cut-offs - Pure",
       weight: "300 kg",
       currentBid: "85,000 LKR",
       timeEnds: "1d 4h",
       type: "Linen",
       image: "https://images.unsplash.com/photo-1594913785162-e6785e7914e6?auto=format&fit=crop&q=80&w=800"
    }
  ]);

  const handlePlaceBid = (amount) => {
    // Update local state to reflect new bid
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
           <p className="text-industrial-500">Live auctions from certified factories.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <AuctionCard 
             key={item.id} 
             {...item} 
             onBid={() => setSelectedBidItem(item)}
          />
        ))}
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
