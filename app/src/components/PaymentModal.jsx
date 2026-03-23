import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, Loader2, CheckCircle, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PaymentModal({ isOpen, onClose, amount, onSuccess }) {
  const { user } = useAuth();
  const storageKey = `wisewaste_saved_card_${user?.id || 'guest'}`;
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Dummy form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [rememberCard, setRememberCard] = useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCardNumber(parsed.cardNumber || '');
        setExpiry(parsed.expiry || '');
        setCvc(parsed.cvc || '');
        setName(parsed.name || '');
        setRememberCard(true);
      }
    } catch (e) {
      console.error('Could not load saved card', e);
    }
  }, [storageKey]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (rememberCard) {
      localStorage.setItem(storageKey, JSON.stringify({
        cardNumber, expiry, cvc, name
      }));
    } else {
      localStorage.removeItem(storageKey);
    }

    setIsProcessing(false);
    setIsSuccess(true);
    
    // Wait a bit to show the success checkmark
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setCardNumber(formattedValue);
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)} / ${value.slice(2)}`;
    }
    setExpiry(value);
  };

  const handleCvcChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    setCvc(value);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isProcessing && !isSuccess && onClose()}
            className="absolute inset-0 bg-industrial-950/90 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-50 bg-industrial-900 border border-industrial-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-industrial-950/50 border-b border-industrial-800 px-6 py-5 flex justify-between items-center relative z-10">
               <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                 <Lock size={18} className="text-nature-500" /> Secure Checkout
               </h3>
               {!isProcessing && !isSuccess && (
                 <button onClick={onClose} className="text-industrial-400 hover:text-white hover:bg-industrial-800 p-1.5 rounded-full transition-colors">
                   <X size={20} />
                 </button>
               )}
            </div>

            {/* Content Area */}
            <div className="p-5 md:p-6">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <CheckCircle size={70} className="text-nature-500 mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
                  </motion.div>
                  <h4 className="text-xl font-black text-white mb-2">Payment Successful</h4>
                  <p className="text-industrial-400 text-sm text-center">Your secure transfer is verified.</p>
                </div>
              ) : (
                <>
                  {/* Total Payment Info inline for space saving */}
                  <div className="flex justify-between items-end mb-4 px-1">
                    <div>
                        <p className="text-industrial-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Payment</p>
                        <div className="text-2xl font-black text-white leading-none">
                        LKR {amount?.toLocaleString()}
                        </div>
                    </div>
                  </div>

                  {/* Beautiful Card UI */}
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative w-full h-40 sm:h-44 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl overflow-hidden mb-5 transition-all duration-300 transform preserve-3d group"
                  >
                    {/* Abstract Glass shapes */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                    
                    {/* Card Header: Chip and Brand */}
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center gap-2">
                        {/* Golden Chip */}
                        <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-300 to-yellow-600 p-px shadow-sm">
                           <div className="w-full h-full border border-yellow-700/30 rounded-sm relative overflow-hidden flex flex-col justify-evenly">
                              <div className="w-full h-px bg-yellow-700/30"></div>
                              <div className="w-full h-px bg-yellow-700/30"></div>
                              <div className="absolute inset-y-0 left-1/3 w-px bg-yellow-700/30"></div>
                              <div className="absolute inset-y-0 right-1/3 w-px bg-yellow-700/30"></div>
                           </div>
                        </div>
                        <Wifi className="rotate-90 ml-1 opacity-80" size={20} strokeWidth={2.5} />
                      </div>
                      <div className="font-black italic text-xl tracking-widest opacity-95 drop-shadow-md">VISA</div>
                    </div>

                    {/* Card Content */}
                    <div className="mt-5 sm:mt-6 relative z-10">
                      <div className="font-mono text-lg sm:text-xl tracking-[0.15em] sm:tracking-[0.2em] mb-4 text-shadow-sm font-medium">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="opacity-90">
                          <p className="text-[8px] uppercase tracking-widest mb-1 opacity-70">Card Holder</p>
                          <p className="font-bold tracking-wide truncate max-w-[150px] sm:max-w-[180px] text-sm">{name || 'YOUR NAME'}</p>
                        </div>
                        <div className="opacity-90 text-right">
                          <p className="text-[8px] uppercase tracking-widest mb-1 opacity-70">Expires</p>
                          <p className="font-bold tracking-wide font-mono text-sm">{expiry || 'MM/YY'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <div className="border border-industrial-700 bg-industrial-900 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-nature-500 focus-within:border-transparent transition-all shadow-inner">
                        <div className="flex items-center px-4 py-2.5 border-b border-industrial-700 w-full group">
                          <CreditCard size={18} className="text-industrial-500 mr-3 shrink-0 group-focus-within:text-nature-500 transition-colors" />
                          <input 
                            type="text" 
                            placeholder="Card number" 
                            required
                            className="w-full text-white placeholder-industrial-600 focus:outline-none bg-transparent font-mono text-base"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                          />
                        </div>
                        <div className="flex">
                          <input 
                            type="text" 
                            placeholder="MM / YY" 
                            required
                            className="w-1/2 px-4 py-2.5 text-white placeholder-industrial-600 focus:outline-none border-r border-industrial-700 bg-transparent font-mono text-base"
                            value={expiry}
                            onChange={handleExpiryChange}
                          />
                          <input 
                            type="text" 
                            placeholder="CVC" 
                            required
                            className="w-1/2 px-4 py-2.5 text-white placeholder-industrial-600 focus:outline-none bg-transparent font-mono text-base"
                            value={cvc}
                            onChange={handleCvcChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <input 
                        type="text" 
                        placeholder="Name on card" 
                        required
                        className="w-full px-4 py-2.5 border border-industrial-700 rounded-xl bg-industrial-900 text-white placeholder-industrial-600 focus:outline-none focus:ring-2 focus:ring-nature-500 transition-all font-medium shadow-inner text-base"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-3 mt-3 mb-1 ml-1">
                      <input 
                        type="checkbox" 
                        id="rememberCard" 
                        className="w-4 h-4 rounded border-industrial-600 bg-industrial-900 text-nature-500 focus:ring-nature-500 focus:ring-offset-industrial-900 border cursor-pointer accent-nature-500 transition-colors"
                        checked={rememberCard}
                        onChange={(e) => setRememberCard(e.target.checked)}
                      />
                      <label htmlFor="rememberCard" className="text-xs font-bold text-industrial-400 cursor-pointer select-none hover:text-industrial-300 transition-colors tracking-wide">
                        Save securely for faster checkout
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isProcessing}
                      className="w-full mt-5 bg-gradient-to-r from-nature-600 to-nature-500 hover:from-nature-500 hover:to-nature-400 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] disabled:opacity-70 disabled:cursor-not-allowed text-base"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Processing...
                        </>
                      ) : (
                        `Pay LKR ${amount?.toLocaleString()}`
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
