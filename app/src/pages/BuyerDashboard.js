import React from 'react';
import HistoryTable from '../components/HistoryTable.js';
import AuctionCard from '../components/AuctionCard.js';

export default function BuyerDashboard() {
  const myBids = [
    {
      id: 2,
      title: "Polyester Rolls - Surplus Grade B",
      weight: "120 kg",
      currentBid: "18,500 LKR",
      timeEnds: "45m",
      type: "Polyester",
      image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-industrial-900 mb-6">Active Bids</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {myBids.map(b => <AuctionCard key={b.id} {...b} />)}
          <div className="border-2 border-dashed border-industrial-200 rounded-xl flex flex-col items-center justify-center p-8 text-industrial-400 gap-4">
             <p>Searching for more?</p>
             <button className="text-nature-600 font-bold hover:underline">Browse Marketplace</button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-industrial-900 mb-6">Procurement History</h2>
        <HistoryTable role="buyer" />
      </div>
    </div>
  );
}
