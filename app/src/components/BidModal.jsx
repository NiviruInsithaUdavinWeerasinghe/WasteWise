import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, CheckCircle } from 'lucide-react';

export default function BidModal({ isOpen, onClose, item, onPlaceBid }) {
  const [amount, setAmount] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      onPlaceBid(amount);
      setIsSuccess(false);
      setAmount('');
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-industrial-900/60 backdrop-blur-sm"
        />
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           className="relative z-50 bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          {isSuccess ? (
             <div className="p-8 text-center bg-nature-50">
                <motion.div 
                   initial={{ scale: 0 }} 
                   animate={{ scale: 1 }} 
                   className="w-16 h-16 bg-nature-100 text-nature-600 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                   <CheckCircle size={32} />
                </motion.div>
                <h3 className="text-xl font-bold text-industrial-900">Bid Placed!</h3>
                <p className="text-industrial-500 mt-2">You are now the highest bidder for {item.title}.</p>
             </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-industrial-100 flex justify-between items-center bg-industrial-50">
                <h3 className="font-bold text-industrial-900">Place Bid</h3>
                <button onClick={onClose} className="text-industrial-400 hover:text-red-500"><X size={20}/></button>
              </div>
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                   <img src={item.image} alt={item.title} className="w-20 h-20 rounded-lg object-cover" />
                   <div>
                      <h4 className="font-bold text-sm text-industrial-900 line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-industrial-500 mt-1">Current Highest: <span className="text-nature-600 font-bold">{item.currentBid}</span></p>
                   </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                   <div>
                      <label className="block text-xs font-medium text-industrial-500 mb-1">Your Max Bid (LKR)</label>
                      <div className="relative">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-400">Rs.</div>
                         <input 
                           type="number" 
                           required
                           value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full pl-10 pr-4 py-2 bg-white border border-industrial-200 rounded-lg focus:ring-2 focus:ring-nature-500 focus:border-nature-500 outline-none font-mono font-medium"
                           placeholder="Enter amount..."
                         />
                      </div>
                   </div>
                   <button type="submit" className="w-full bg-nature-600 hover:bg-nature-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-nature-200 flex justify-center items-center gap-2">
                      Confirm Bid <TrendingUp size={18} />
                   </button>
                </form>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
