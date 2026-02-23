import React from 'react';
import HistoryTable from '../components/HistoryTable.jsx';
import { ShoppingBag, Star } from 'lucide-react';

export default function IndividualDashboard() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-nature-50 p-6 rounded-xl border border-nature-100 flex items-center gap-6">
         <div className="bg-white p-4 rounded-full shadow-sm text-nature-600">
            <Star size={32} fill="currentColor" />
         </div>
         <div>
           <h2 className="text-2xl font-bold text-nature-900">Eco-Warrior Status: Silver</h2>
           <p className="text-nature-700">You've saved 45kg of waste from landfills!</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-industrial-200">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
               <ShoppingBag size={20} /> Saved Items
             </h3>
             <p className="text-industrial-500 text-sm">Track materials you are interested in for small craft projects.</p>
          </div>
      </div>

      <HistoryTable role="individual" />
    </div>
  );
}
