import React from 'react';
import { ArrowRight, ShieldCheck, Truck, BarChart3 } from 'lucide-react';
import AuctionCard from '../components/AuctionCard';
import { motion } from 'framer-motion';

export default function Home({ onOpenUpload }) {
  const auctions = [
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
    }
  ];

  return (
    <div className="pt-16 min-h-screen bg-industrial-50 font-sans text-industrial-900">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-industrial-900 pt-20 pb-32 lg:pt-32 lg:pb-40">
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
              <button 
                onClick={onOpenUpload}
                className="w-full sm:w-auto px-8 py-4 bg-nature-600 hover:bg-nature-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-nature-500/30 flex items-center justify-center gap-2"
              >
                Start Selling <ArrowRight size={20} />
              </button>
              <a href="/marketplace" className="inline-flex items-center w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold backdrop-blur-md transition-all border border-white/10 justify-center">
                Browse Marketplace
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats / Trust */}
      <section className="bg-white py-12 border-b border-industrial-200">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-industrial-100">
            <div>
               <div className="text-4xl font-bold text-nature-600 mb-1">500+</div>
               <div className="text-sm text-industrial-500 font-medium">Factories Registered</div>
            </div>
            <div>
               <div className="text-4xl font-bold text-nature-600 mb-1">12kT</div>
               <div className="text-sm text-industrial-500 font-medium">Waste Diverted</div>
            </div>
            <div>
               <div className="text-4xl font-bold text-nature-600 mb-1">Rs 45M</div>
               <div className="text-sm text-industrial-500 font-medium">Value Generated</div>
            </div>
            <div>
               <div className="text-4xl font-bold text-nature-600 mb-1">100%</div>
               <div className="text-sm text-industrial-500 font-medium">Compliance Rate</div>
            </div>
         </div>
      </section>

      {/* Featured Auctions */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
           <div>
              <h2 className="text-3xl font-bold text-industrial-900 mb-3">Live Material Auctions</h2>
              <p className="text-industrial-500">Bid on verified bulk materials from certified factories.</p>
           </div>
           <button className="hidden md:flex items-center gap-2 text-nature-700 font-medium hover:text-nature-900">
             View All Listings <ArrowRight size={18} />
           </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {auctions.map(item => (
             <AuctionCard key={item.id} {...item} />
           ))}
        </div>
        
        <button className="w-full md:hidden mt-8 py-3 bg-white border border-industrial-300 rounded-lg text-industrial-700 font-medium">
             View All Listings
        </button>
      </section>

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
    </div>
  )
}
