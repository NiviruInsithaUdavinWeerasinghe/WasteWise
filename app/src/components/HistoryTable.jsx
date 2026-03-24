import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Shield, CheckCircle, RefreshCw, Box, AlertTriangle, ShoppingBag, Clock, XCircle, FileSignature, X, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function HistoryTable({ role, data = [], title = "Recent History", onViewAll, isShowingAll, totalItems }) {
  const { user } = useAuth();
  // Use passed data over hardcoded arrays
  const displayData = data;
  const [selectedItem, setSelectedItem] = useState(null);

  const getIcon = (type) => {
    switch (type) {
      case 'Sale': return <ArrowUpRight size={16} className="text-nature-500" />;
      case 'Purchase': return <ShoppingBag size={16} className="text-nature-500" />;
      case 'Bid': return <ArrowDownLeft size={16} className="text-orange-500" />;
      case 'Contract': return <FileSignature size={16} className="text-blue-500" />;
      case 'Certificate':
      case 'Verification': return <Shield size={16} className="text-blue-500" />;
      case 'System': return <RefreshCw size={16} className="text-purple-500" />;
      case 'Transaction': return <Box size={16} className="text-nature-600" />;
      case 'Flagged': return <AlertTriangle size={16} className="text-red-500" />;
      default: return <CheckCircle size={16} className="text-industrial-500" />;
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
      case 'Pending':
      case 'Pending Payment':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Investigating':
      case 'Outbid':
      case 'Failed':
      case 'No Bids':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Ready for Pickup':
      case 'Pending Delivery':
      case 'Expired':
        return 'bg-industrial-800 text-industrial-400 border-industrial-700';
      case 'Ready for Pickup':
      case 'Pending Delivery':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-industrial-800 text-industrial-300 border-industrial-700';
    }
  };

  const tableHeaders = role === 'individual' ? (
    <tr>
      <th className="px-4 py-4 font-bold tracking-wider w-auto">Action / Item</th>
      <th className="px-4 py-4 font-bold tracking-wider">Date</th>
      <th className="px-4 py-4 font-bold tracking-wider">Factory (Seller)</th>
      <th className="px-4 py-4 font-bold tracking-wider">Amount Paid/Bid</th>
      <th className="px-4 py-4 font-bold tracking-wider">Status</th>
    </tr>
  ) : role === 'company-buyer' ? (
    <tr>
      <th className="px-4 py-4 font-bold tracking-wider w-auto">Action / Material</th>
      <th className="px-4 py-4 font-bold tracking-wider">Date</th>
      <th className="px-4 py-4 font-bold tracking-wider">Source Factory</th>
      <th className="px-4 py-4 font-bold tracking-wider">Amount (LKR)</th>
      <th className="px-4 py-4 font-bold tracking-wider">Status</th>
    </tr>
  ) : (
    <tr>
      <th className="px-4 py-4 font-bold tracking-wider w-auto">Action / Item</th>
      <th className="px-4 py-4 font-bold tracking-wider">Date & Time</th>
      <th className="px-4 py-4 font-bold tracking-wider">Winner / Partner</th>
      <th className="px-4 py-4 font-bold tracking-wider">Value</th>
      <th className="px-4 py-4 font-bold tracking-wider">Status</th>
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
        alert(data.message || 'Failed to download agreement');
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("An error occurred during download.");
    }
  };

  return (
    <div className="w-full">
      <div className="w-full">
        {displayData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-industrial-900 border border-industrial-800 flex items-center justify-center text-industrial-500 mb-4 shadow-inner">
              <Archive size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No history found</h3>
            <p className="text-sm text-industrial-400 max-w-sm px-4">There are currently no items or transactions to display in this table.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse table-auto">
            <thead className="text-xs text-industrial-400 uppercase bg-industrial-950/50 border-y border-industrial-800">
              {tableHeaders}
            </thead>
            <tbody>
              {displayData.map((item, i) => {
                // Parse backend schema fields -> standard display fields
                const isDBObj = !!item._id;
                const uniqueKey = isDBObj ? item._id : item.id;

                // Depending on if it's an active listing, sold listing, or other
                let mappedType = isDBObj ? (item.sellingMethod === 'auction' ? 'Auction' : 'Direct') : item.type;
                let mappedItem = isDBObj ? `${item.wasteType} (${item.weight}kg)` : item.item;
                let mappedDate = isDBObj ? new Date(item.createdAt).toLocaleDateString() : item.date;

                let finalPriceValue = item.price || item.startingBid || 0;
                if (isDBObj && item.sellingMethod === 'auction' && item.bids && item.bids.length > 0) {
                  finalPriceValue = Math.max(...item.bids.map(b => b.amount));
                }
                let mappedAmount = isDBObj ? `LKR ${finalPriceValue}` : item.amount;
                let mappedStatus = isDBObj ? (
                  item.status === 'completed' ? 'Completed' :
                    item.status === 'sold' || item.status === 'paid' ? 'Paid' :
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
                    onClick={() => setSelectedItem({ ...item, mappedItem, mappedType, mappedDate, mappedAmount, mappedStatus, mappedPartner })}
                    className="border-b border-industrial-800 hover:bg-industrial-800/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-4 w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-industrial-900 border border-industrial-700 shadow-sm flex items-center justify-center shrink-0 group-hover:bg-industrial-800 transition-colors">
                          {getIcon(mappedType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white shadow-sm leading-tight" title={mappedItem}>{mappedItem}</p>
                          <p className="text-xs text-industrial-500">{mappedType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-industrial-400 text-xs font-medium whitespace-nowrap">{mappedDate}</td>
                    <td className="px-4 py-4 text-industrial-300 font-medium whitespace-nowrap">{mappedPartner}</td>
                    <td className="px-4 py-4 font-mono font-bold text-white whitespace-nowrap">{mappedAmount}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-center">
                        <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(mappedStatus)} text-center min-w-[80px]`}>
                          {mappedStatus}
                        </span>
                        {(mappedStatus === 'Paid' || mappedStatus === 'Completed') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadSLA(uniqueKey);
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
      {(totalItems === undefined || totalItems >= 3) && (
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
              className="relative z-50 bg-industrial-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-industrial-800 flex flex-col p-6"
            >
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-industrial-400 hover:text-white transition-colors bg-industrial-800 rounded-full p-2">
                <X size={16} />
              </button>

              <div className="flex items-center gap-4 mb-6 pr-8">
                <div className="w-12 h-12 rounded-full bg-industrial-800 border border-industrial-700 shadow-sm flex items-center justify-center shrink-0">
                  {getIcon(selectedItem.mappedType)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg leading-tight">{selectedItem.mappedItem}</h3>
                  <p className="text-sm text-nature-500 font-medium">{selectedItem.mappedType}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-industrial-800/50">
                  <span className="text-industrial-400 text-sm">Date</span>
                  <span className="text-white font-medium">{selectedItem.mappedDate}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-industrial-800/50">
                  <span className="text-industrial-400 text-sm">Partner / Location</span>
                  <span className="text-white font-medium">{selectedItem.mappedPartner}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-industrial-800/50">
                  <span className="text-industrial-400 text-sm">Amount</span>
                  <span className="text-white font-mono font-bold text-lg">{selectedItem.mappedAmount}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-industrial-800/50">
                  <span className="text-industrial-400 text-sm">Status</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedItem.mappedStatus)}`}>
                    {selectedItem.mappedStatus}
                  </span>
                </div>
              </div>

              {(selectedItem.mappedStatus === 'Completed' || selectedItem.mappedStatus === 'Paid' || selectedItem.mappedStatus === 'Active') ? (
                <div className="mb-6 space-y-3">
                  <p className="text-industrial-500 text-xs font-bold uppercase tracking-wider mb-2">Contracts & SLA</p>
                  {(selectedItem.mappedStatus === 'Completed' || selectedItem.mappedStatus === 'Paid') && (
                    <button
                      onClick={() => handleDownloadSLA(selectedItem._id)}
                      className="w-full py-3 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    >
                      <FileSignature size={18} /> View Trade Agreement (SLA)
                    </button>
                  )}
                  {(selectedItem.mappedStatus === 'Completed') && (
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
                            alert(data.message || 'Failed to download certificate');
                          }
                        } catch (error) {
                          console.error("Download error:", error);
                          alert("An error occurred during download.");
                        }
                      }}
                      className="w-full py-3 border border-nature-500/30 bg-nature-500/10 hover:bg-nature-500/20 text-nature-400 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    >
                      <Shield size={18} /> Download Green Certificate (PDF)
                    </button>
                  )}
                </div>
              ) : null}

              <div className="mt-2">
                <button onClick={() => setSelectedItem(null)} className="w-full bg-industrial-800 hover:bg-industrial-700 text-white font-bold py-3 rounded-xl transition-colors">
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
