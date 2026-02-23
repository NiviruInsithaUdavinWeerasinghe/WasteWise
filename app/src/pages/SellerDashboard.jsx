import React, { useState, useEffect } from 'react';
import DashboardChart from '../components/DashboardChart.jsx';
import HistoryTable from '../components/HistoryTable.jsx';
import { Upload, Leaf, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SellerDashboard({ onOpenUpload }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalWeight: 0,
    revenue: 0,
    activeListings: 0
  });

  useEffect(() => {
    const fetchSellerStats = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`http://localhost:5000/api/listings/seller/${user.id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });

        if (response.ok) {
          const listings = await response.json();
          
          let weight = 0;
          let rev = 0;
          let active = 0;

          listings.forEach(listing => {
            if (listing.status === 'sold') {
              weight += listing.weight || 0;
              rev += listing.price || listing.startingBid || 0;
            } else if (listing.status === 'active') {
              active += 1;
            }
          });

          setStats({
            totalWeight: weight,
            revenue: rev,
            activeListings: active
          });
        }
      } catch (error) {
        console.error("Failed to fetch seller listings:", error);
      }
    };

    fetchSellerStats();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-gradient-to-r from-nature-800 to-nature-600 rounded-2xl p-8 text-white flex flex-col md:flex-row justify-between items-center shadow-lg shadow-nature-900/20">
         <div>
           <h2 className="text-3xl font-bold mb-2">Factory Waste Management</h2>
           <p className="text-nature-100 max-w-xl">Upload your daily fabric cut-offs to generate Green Certificates and revenue.</p>
         </div>
         <button 
           onClick={onOpenUpload}
           className="mt-6 md:mt-0 bg-white text-nature-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-nature-50 transition-colors shadow-xl"
         >
           <Upload size={20} /> Upload Waste
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-industrial-200">
           <div className="flex items-center gap-3 mb-2 text-nature-600">
             <Leaf size={20} /> <span className="font-bold text-sm">Waste Diverted</span>
           </div>
           <div className="text-3xl font-bold text-industrial-900">{stats.totalWeight.toLocaleString()} kg</div>
           <div className="text-xs text-industrial-400 mt-1">Total completed</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-industrial-200">
           <div className="flex items-center gap-3 mb-2 text-blue-600">
             <DollarSign size={20} /> <span className="font-bold text-sm">Revenue Generated</span>
           </div>
           <div className="text-3xl font-bold text-industrial-900">Rs {(stats.revenue).toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-industrial-200">
           <div className="flex items-center gap-3 mb-2 text-orange-600">
             <Upload size={20} /> <span className="font-bold text-sm">Active Listings</span>
           </div>
           <div className="text-3xl font-bold text-industrial-900">{stats.activeListings}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HistoryTable role="seller" />
        <DashboardChart title="Monthly Waste Trends" />
      </div>
    </div>
  );
}
