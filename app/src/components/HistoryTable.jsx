import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Shield, CheckCircle, RefreshCw, Box, AlertTriangle, ShoppingBag, Clock, XCircle, FileSignature, X, Archive, CloudRain, Users, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getOptimizedUrl } from '../services/cloudinaryService';

export default function HistoryTable({ role, data = [], title = "Recent History", onViewAll, isShowingAll, totalItems }) {
  const { user } = useAuth();
  // Use passed data over hardcoded arrays
  const displayData = data;
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getMaterialImage = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('plastic')) return 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&q=80&w=800';
    if (t.includes('paper') || t.includes('cardboard')) return 'https://images.unsplash.com/photo-1603504381273-df13b2c159fb?auto=format&fit=crop&q=80&w=800';
    if (t.includes('metal') || t.includes('steel') || t.includes('iron')) return 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=800';
    if (t.includes('glass')) return 'https://images.unsplash.com/photo-1514222045585-64d88e632831?auto=format&fit=crop&q=80&w=800';
    if (t.includes('electronic') || t.includes('e-waste')) return 'https://images.unsplash.com/photo-1550005973-54cac8ed9d27?auto=format&fit=crop&q=80&w=800';
    if (t.includes('fabric') || t.includes('textile') || t.includes('cotton') || t.includes('denim') || t.includes('silk')) return 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800';
    if (t.includes('polyester')) return 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800';
    return 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800';
  };

  const getIcon = (type, status = '') => {
    const s = (status || '').toLowerCase();
    if (['completed', 'verified', 'received', 'approved'].includes(s)) return <CheckCircle size={16} className="text-nature-500" />;
    if (['paid', 'payment'].includes(s)) return <ShoppingBag size={16} className="text-blue-500" />;
    if (['failed', 'no bids', 'expired', 'closed', 'outbid'].includes(s)) return <XCircle size={16} className="text-red-500" />;
    if (s === 'reassigned') return <UserCheck size={16} className="text-purple-500" />;
    if (['pending payment', 'pending'].includes(s)) return <Clock size={16} className="text-yellow-500" />;
    if (s === 'active') return <RefreshCw size={16} className="text-orange-500 animate-spin-slow" />;

    switch (type) {
      case 'Sale': 
      case 'Direct': return <ArrowUpRight size={16} className="text-nature-500" />;
      case 'Purchase': return <ShoppingBag size={16} className="text-nature-500" />;
      case 'Bid': return <ArrowDownLeft size={16} className="text-orange-500" />;
      case 'Contract': return <FileSignature size={16} className="text-blue-500" />;
      case 'Certificate':
      case 'Verification': return <Shield size={16} className="text-blue-500" />;
      case 'Auction': return <Clock size={16} className="text-orange-500" />;
      case 'User': 
      case 'New User': return <Users size={16} className="text-purple-500" />;
      case 'System': return <RefreshCw size={16} className="text-purple-500" />;
      case 'Transaction': return <Box size={16} className="text-nature-600" />;
      case 'Flagged': return <AlertTriangle size={16} className="text-red-500" />;
      default: return <Box size={16} className="text-industrial-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
      case 'Verified':
      case 'Won':
      case 'Received':
        return 'bg-nature-500/10 text-nature-400 border-nature-500/20';
      case 'Active':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Paid':
      case 'Payment':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Pending':
      case 'Pending Payment':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Investigating':
      case 'Outbid':
      case 'Failed':
      case 'No Bids':
      case 'Expired':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Reassigned':
      case 'Reassigned (Pending)':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Ready for Pickup':
      case 'Pending Delivery':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-industrial-800 text-industrial-300 border-industrial-700';
    }
  };

  const tableHeaders = role === 'individual' ? (
    <tr>
      <th className="px-4 py-4 font-bold tracking-wider w-[32%] text-left bg-industrial-950/80">Action / Item</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[15%] text-left bg-industrial-950/80">Date</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[18%] text-left bg-industrial-950/80">Factory (Seller)</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[17%] text-right font-mono pr-8 bg-industrial-950/80">Amount</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[18%] text-center bg-industrial-950/80">Status</th>
    </tr>
  ) : role === 'company-buyer' ? (
    <tr>
      <th className="px-4 py-4 font-bold tracking-wider w-[32%] text-left bg-industrial-950/80">Action / Material</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[15%] text-left bg-industrial-950/80">Date</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[18%] text-left bg-industrial-950/80">Source Factory</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[17%] text-right font-mono pr-8 bg-industrial-950/80">Amount (LKR)</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[18%] text-center bg-industrial-950/80">Status</th>
    </tr>
  ) : (
    <tr>
      <th className="px-4 py-4 font-bold tracking-wider w-[32%] text-left pl-6 bg-industrial-950/80 border-b border-industrial-800">Action / Item</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[15%] text-left bg-industrial-950/80 border-b border-industrial-800">Date & Time</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[18%] text-left bg-industrial-950/80 border-b border-industrial-800">Winner / Partner</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[17%] text-right font-mono pr-8 bg-industrial-950/80 border-b border-industrial-800">Value</th>
      <th className="px-4 py-4 font-bold tracking-wider w-[18%] text-center pr-6 bg-industrial-950/80 border-b border-industrial-800">Status</th>
    </tr>
  );

  const handleDownloadSLA = async (listingId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/agreements/${listingId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `TradeAgreement_${listingId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to download agreement' });
      }
    } catch (error) {
      console.error("Download error:", error);
      setMessage({ type: 'error', text: "An error occurred during download." });
    }
    // Clear message after 3 seconds
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div className="w-full relative">
      <AnimatePresence>
        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${message.type === 'success' ? 'bg-nature-500/90 text-white border-nature-400/30' : 'bg-red-500/90 text-white border-red-400/30'}`}
          >
            {message.type === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
            <span className="text-sm font-bold tracking-tight">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="bg-industrial-900 border border-industrial-800 shadow-2xl relative">
        {displayData.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <motion.div 
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 3, -3, 0]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="w-24 h-24 rounded-[2rem] bg-industrial-900 border border-industrial-800 flex items-center justify-center text-industrial-500/40 mb-8 shadow-2xl relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-nature-500/10 to-transparent rounded-[2rem] opacity-50" />
              <Archive size={48} strokeWidth={1.2} className="relative z-10" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-industrial-800 rounded-full border border-industrial-700 flex items-center justify-center">
                 <RefreshCw size={14} className="text-industrial-600 animate-spin-slow" />
              </div>
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">No Activity Records</h3>
            <p className="text-industrial-500 max-w-[280px] px-4 text-sm leading-relaxed font-medium">
              Your platform history is currently clear. Transactions and trading activity will appear here in real-time.
            </p>
          </motion.div>
        ) : (
          <table className="w-full text-sm text-left border-collapse table-fixed">
            <thead className="text-xs text-industrial-400 uppercase sticky top-0 z-10 backdrop-blur-md">
              {tableHeaders}
            </thead>
            <tbody>
              {displayData.map((item, i) => {
                // Parse backend schema fields -> standard display fields
                const isDBObj = !!item._id;
                const uniqueKey = isDBObj ? item._id : item.id;

                // Depending on if it's an active listing, sold listing, or other
                let mappedType = isDBObj ? (item.sellingMethod === 'auction' ? 'Auction' : 'Direct') : item.type;
                let mappedItem = isDBObj ? `${item.wasteType || 'Material'} (${item.weight || '0'}kg)` : (item.item || 'Generic Activity');
                const rawDate = isDBObj ? item.createdAt : item.date;
                const dateObj = new Date(rawDate);
                let mappedDate = isNaN(dateObj) ? '-' : `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                let finalPriceValue = item.price || item.startingBid || 0;
                if (isDBObj && item.sellingMethod === 'auction' && item.bids && item.bids.length > 0) {
                  finalPriceValue = Math.max(...item.bids.map(b => b.amount));
                }
                let mappedAmount = isDBObj ? `LKR ${finalPriceValue}` : item.amount;
                const hasDefaulted = isDBObj && item.defaultedBids && item.defaultedBids.length > 0;
                let mappedStatus = isDBObj ? (
                  item.status === 'completed' ? 'Completed' :
                    item.status === 'sold' || item.status === 'paid' ? 'Paid' :
                      (item.status === 'pending_payment' && hasDefaulted) ? 'Reassigned' :
                        item.status === 'pending_payment' ? 'Pending Payment' :
                          item.status === 'failed_payment' ? 'Failed' :
                            item.status === 'no_bids' ? 'No Bids' :
                              item.status === 'expired' ? 'Expired' : 'Active'
                ) : item.status;
                let mappedPartner = '-';
                if (isDBObj && (item.status === 'sold' || item.status === 'paid' || item.status === 'pending_payment' || item.status === 'completed')) {
                  if (item.bids && item.bids.length > 0) {
                    // Find highest bid
                    const highestBid = item.bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
                    mappedPartner = highestBid.userId?.name ? highestBid.userId.name : 'Buyer Found';
                  } else {
                    mappedPartner = 'No Bids';
                  }
                } else if (!isDBObj) {
                  mappedPartner = item.partner;
                }

                return (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={uniqueKey}
                    onClick={() => {
                        const dlId = item.listingId || uniqueKey;
                        setSelectedItem({ ...item, mappedItem, mappedType, mappedDate, mappedAmount, mappedStatus, mappedPartner, downloadId: dlId });
                    }}
                    className="border-b border-industrial-800 hover:bg-industrial-800/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-4 w-[32%] pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-industrial-900 border border-industrial-700 shadow-sm flex items-center justify-center shrink-0 group-hover:bg-industrial-800 transition-colors">
                          {getIcon(mappedType, mappedStatus)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white shadow-sm leading-tight truncate" title={mappedItem}>{mappedItem}</p>
                          <p className="text-xs text-industrial-500">{mappedType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-industrial-400 text-xs font-medium whitespace-nowrap w-[15%]">{mappedDate}</td>
                    <td className="px-4 py-4 text-industrial-300 font-medium truncate w-[18%]">{mappedPartner}</td>
                    <td className="px-4 py-4 font-mono font-bold text-white whitespace-nowrap text-right pr-8 w-[17%]">{mappedAmount}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-center w-[18%] pr-6">
                      <div className="flex flex-col gap-1 items-center">
                        <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(mappedStatus)} text-center min-w-[80px]`}>
                          {mappedStatus}
                        </span>
                        {(mappedStatus === 'Paid' || mappedStatus === 'Completed' || mappedStatus === 'Verified') && mappedType !== 'Auction' && mappedType !== 'Direct' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadSLA(item.listingId || uniqueKey);
                            }}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1 mt-0.5"
                          >
                            <FileSignature size={12} /> View SLA
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {onViewAll && (totalItems === undefined || totalItems >= 3) && (
        <div className="p-4 border-t border-industrial-800 bg-industrial-950/30 text-center">
          <button onClick={onViewAll} className="text-sm font-bold text-nature-500 hover:text-nature-400 transition-colors py-2 px-6 rounded-xl hover:bg-nature-500/10 active:scale-95">
            {isShowingAll ? 'Show Less' : `View All ${title} \u2192`}
          </button>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-industrial-950/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-50 bg-industrial-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-industrial-800 flex flex-col md:flex-row max-h-[90vh]"
            >
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-industrial-400 hover:text-white transition-colors bg-industrial-800/50 backdrop-blur-md rounded-full p-2 z-20">
                <X size={18} />
              </button>

              {/* Left Column: Visuals & Primary Info */}
              <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-industrial-800 flex flex-col">
                {/* Image Section */}
                <div className="w-full aspect-video md:aspect-square shrink-0 overflow-hidden relative">
                  <div className="w-full h-full bg-industrial-800 flex items-center justify-center">
                    {selectedItem.type === 'User' ? (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-900 flex items-center justify-center">
                        <Users size={120} className="text-white/20" />
                        <span className="absolute text-5xl font-black text-white/90 drop-shadow-2xl">
                          {selectedItem.partner?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={selectedItem.imageUrl ? getOptimizedUrl(selectedItem.imageUrl) : getMaterialImage(selectedItem.wasteType || '')}
                        alt={selectedItem.wasteType || 'listing'}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = getMaterialImage(selectedItem.wasteType || ''); }}
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-industrial-900 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold bg-nature-500 text-white px-2 py-0.5 rounded shadow-lg">
                        {selectedItem.mappedType}
                      </span>
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded shadow-lg border ${getStatusColor(selectedItem.mappedStatus)}`}>
                        {selectedItem.mappedStatus}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-xl leading-tight drop-shadow-md">{selectedItem.mappedItem}</h3>
                  </div>
                </div>

                {/* Description & Secondary Meta */}
                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="mb-6">
                    <p className="text-industrial-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Description</p>
                    <p className="text-industrial-300 text-sm leading-relaxed italic">
                      {selectedItem.description || "No additional description provided for this item."}
                    </p>
                  </div>

                  {role === 'seller' && selectedItem.weight && selectedItem.mappedStatus === 'Completed' && (
                    <div className="mt-auto pt-6 border-t border-industrial-800/50">
                      <div className="bg-nature-500/5 border border-nature-500/10 rounded-2xl p-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                           <CloudRain size={80} className="text-nature-400" />
                        </div>
                        <p className="text-[10px] font-bold text-nature-500 uppercase tracking-widest mb-1">Impact Track</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-extrabold text-white">
                            {(selectedItem.carbonSaved || selectedItem.weight * 15.6).toFixed(1)}
                          </span>
                          <span className="text-xs font-bold text-nature-400">kg CO₂</span>
                        </div>
                        <p className="text-[10px] text-industrial-500 mt-1 font-medium">Prevented via {selectedItem.weight}kg diversion</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Transactional Records & Actions */}
              <div className="w-full md:w-7/12 flex flex-col bg-industrial-950/30">
                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                  <p className="text-industrial-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Transaction Details</p>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-8 mb-10">
                    <div className="space-y-1">
                      <p className="text-industrial-500 text-xs font-medium">Activity Date</p>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-nature-500" />
                        <p className="text-white font-semibold">{selectedItem.mappedDate}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-industrial-500 text-xs font-medium">{selectedItem.type === 'User' ? 'Full Name' : (selectedItem.type === 'Bid' ? 'Bidder' : 'Trade Partner')}</p>
                      <div className="flex items-center gap-2">
                        {selectedItem.type === 'User' ? <Users size={14} className="text-nature-500" /> : <Box size={14} className="text-nature-500" />}
                        <p className="text-white font-semibold truncate" title={selectedItem.mappedPartner}>
                          {selectedItem.mappedPartner}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-industrial-500 text-xs font-medium">{selectedItem.type === 'User' ? 'Assigned Role' : 'Total Valuation'}</p>
                      <div className="flex items-center gap-2">
                        <ShoppingBag size={14} className="text-nature-500" />
                        <p className="text-base font-bold text-white font-mono lowercase">{selectedItem.type === 'User' ? (selectedItem.role?.replace('company-', '') || '-') : selectedItem.mappedAmount}</p>
                      </div>
                    </div>

                    {selectedItem.email && (
                      <div className="space-y-1">
                        <p className="text-industrial-500 text-xs font-medium">Contact Email</p>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-nature-500" />
                          <p className="text-white font-semibold flex-1 truncate">{selectedItem.email}</p>
                        </div>
                      </div>
                    )}

                    {selectedItem.condition && (
                      <div className="space-y-1">
                        <p className="text-industrial-500 text-xs font-medium">Material Grade</p>
                        <div className="flex items-center gap-2">
                          <Shield size={14} className="text-nature-500" />
                          <p className="text-white font-semibold">{selectedItem.condition}</p>
                        </div>
                      </div>
                    )}

                    {selectedItem.location && (
                      <div className="space-y-1 col-span-2">
                        <p className="text-industrial-500 text-xs font-medium">Registered Location</p>
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-nature-500" />
                          <p className="text-industrial-300 text-sm font-medium">{selectedItem.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documents Section */}
                  {(selectedItem.mappedStatus === 'Completed' || selectedItem.mappedStatus === 'Paid' || selectedItem.mappedStatus === 'Verified') && (
                    <div className="space-y-4">
                      <p className="text-industrial-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Verification & Documents</p>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => handleDownloadSLA(selectedItem.downloadId)}
                          className="group flex items-center justify-between p-4 rounded-xl border border-industrial-800 bg-industrial-900/50 hover:bg-industrial-800 hover:border-blue-500/50 transition-all duration-300 overflow-hidden relative"
                        >
                          <div className="flex items-center gap-4 z-10">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                              <FileSignature size={20} />
                            </div>
                            <div className="text-left">
                              <p className="text-white font-bold text-sm">Trade Agreement (SLA)</p>
                              <p className="text-industrial-500 text-xs">Standardized legal framework</p>
                            </div>
                          </div>
                          <ArrowUpRight size={18} className="text-industrial-600 group-hover:text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all z-10" />
                          <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        </button>

                        {(selectedItem.mappedStatus === 'Completed' || selectedItem.mappedStatus === 'Verified') && (
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(`http://localhost:5000/api/listings/${selectedItem._id}/certificate`, {
                                  method: 'GET',
                                  headers: {
                                    'Authorization': `Bearer ${user.token}`
                                  }
                                });

                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.setAttribute('download', `GreenCertificate_${selectedItem._id}.pdf`);
                                  document.body.appendChild(link);
                                  link.click();
                                  link.remove();
                                  window.URL.revokeObjectURL(url);
                                } else {
                                  const data = await response.json();
                                  setMessage({ type: 'error', text: data.message || 'Failed to download certificate' });
                                }
                              } catch (error) {
                                console.error("Download error:", error);
                                setMessage({ type: 'error', text: "An error occurred during download." });
                              }
                              setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                            }}
                            className="group flex items-center justify-between p-4 rounded-xl border border-industrial-800 bg-industrial-900/50 hover:bg-industrial-800 hover:border-nature-500/50 transition-all duration-300 overflow-hidden relative"
                          >
                            <div className="flex items-center gap-4 z-10">
                              <div className="w-10 h-10 rounded-lg bg-nature-500/10 flex items-center justify-center text-nature-400 group-hover:scale-110 transition-transform">
                                <Shield size={20} />
                              </div>
                              <div className="text-left">
                                <p className="text-white font-bold text-sm">Green Certificate</p>
                                <p className="text-industrial-500 text-xs">Environmental impact validation</p>
                              </div>
                            </div>
                            <ArrowUpRight size={18} className="text-industrial-600 group-hover:text-nature-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all z-10" />
                            <div className="absolute inset-0 bg-nature-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-8 pt-0">
                  <button 
                    onClick={() => setSelectedItem(null)} 
                    className="w-full bg-industrial-900 hover:bg-industrial-800 text-industrial-300 hover:text-white font-bold py-4 rounded-xl transition-all border border-industrial-800 active:scale-[0.98]"
                  >
                    Close Transaction View
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
