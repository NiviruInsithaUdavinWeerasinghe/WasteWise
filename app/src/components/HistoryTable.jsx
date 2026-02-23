import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Shield, CheckCircle, RefreshCw, Box, AlertTriangle, ShoppingBag, Clock, XCircle, FileSignature } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HistoryTable({ role }) {
  // Enhanced Mock Data based on role
  const adminData = [
    { id: 1, type: 'Verification', item: 'Factory Reg #849', date: '2025-10-24 14:30', amount: '-', status: 'Approved', partner: 'TexLanka Pvt Ltd' },
    { id: 2, type: 'System', item: 'Weekly Certificate Batch', date: '2025-10-23 09:00', amount: '1,420 Certs', status: 'Completed', partner: 'Auto-Issue' },
    { id: 3, type: 'Flagged', item: 'Suspicious Bid Activity', date: '2025-10-22 16:45', amount: 'LKR 4.5M', status: 'Investigating', partner: 'User ID: 90214' },
    { id: 4, type: 'Verification', item: 'Factory Reg #850', date: '2025-10-22 11:20', amount: '-', status: 'Pending', partner: 'Oceanic Threads' },
    { id: 5, type: 'Transaction', item: 'Platform Fee Collection', date: '2025-10-21 23:59', amount: 'LKR 125,400', status: 'Completed', partner: 'Payment Gateway' },
  ];

  const sellerData = [
    { id: 1, type: 'Sale', item: 'Cotton Offcuts 500kg', date: '2025-10-15', amount: '45,000 LKR', status: 'Completed', partner: 'EcoRecycle Pvt Ltd' },
    { id: 2, type: 'Bid', item: 'Polyester Rolls', date: '2025-10-18', amount: '12,500 LKR', status: 'Pending', partner: 'TexFab Lanka' },
    { id: 3, type: 'Certificate', item: 'Green Cert #4021', date: '2025-10-14', amount: '-', status: 'Verified', partner: 'WasteWise Authority' },
    { id: 4, type: 'Sale', item: 'Denim Scraps', date: '2025-10-10', amount: '88,000 LKR', status: 'Completed', partner: 'Global Fibers' },
  ];

  const individualData = [
    { id: 1, type: 'Purchase', item: 'Cotton Offcuts 5kg', date: '2025-10-24 10:30', amount: '450 LKR', status: 'Ready for Pickup', partner: 'EcoRecycle Pvt Ltd' },
    { id: 2, type: 'Bid', item: 'Denim Scraps 2kg', date: '2025-10-22 14:15', amount: '800 LKR', status: 'Outbid', partner: 'TexLanka Pvt Ltd' },
    { id: 3, type: 'Bid', item: 'Polyester Threads 1kg', date: '2025-10-20 09:45', amount: '150 LKR', status: 'Pending', partner: 'Oceanic Threads' },
    { id: 4, type: 'Purchase', item: 'Mixed Fabric Bundle 3kg', date: '2025-10-18 16:20', amount: '600 LKR', status: 'Won', partner: 'Global Fibers' },
  ];

  const companyBuyerData = [
    { id: 1, type: 'Contract', item: 'Polyester Rolls 1,500kg', date: '2025-10-24', amount: '185,000 LKR', status: 'Completed', partner: 'TexFab Lanka' },
    { id: 2, type: 'Purchase', item: 'Cotton Offcuts 500kg', date: '2025-10-23', amount: '45,000 LKR', status: 'Pending Delivery', partner: 'EcoRecycle Pvt Ltd' },
    { id: 3, type: 'Bid', item: 'Denim Bales 800kg', date: '2025-10-21', amount: '95,000 LKR', status: 'Pending', partner: 'Global Fibers' },
    { id: 4, type: 'Purchase', item: 'Synthetic Scraps 2,000kg', date: '2025-10-15', amount: '210,000 LKR', status: 'Received', partner: 'Oceanic Threads' },
  ];

  const displayData = role === 'admin' ? adminData : role === 'company-seller' ? sellerData : role === 'individual' ? individualData : role === 'company-buyer' ? companyBuyerData : sellerData;

  const getIcon = (type) => {
     switch(type) {
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
     switch(status) {
        case 'Completed':
        case 'Approved':
        case 'Verified': 
        case 'Won': 
        case 'Received':
           return 'bg-nature-500/10 text-nature-400 border-nature-500/20';
        case 'Pending': 
           return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        case 'Investigating': 
        case 'Outbid':
           return 'bg-red-500/10 text-red-400 border-red-500/20';
        case 'Ready for Pickup':
        case 'Pending Delivery':
           return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        default: 
           return 'bg-industrial-800 text-industrial-300 border-industrial-700';
     }
  };

  const tableHeaders = role === 'individual' ? (
    <tr>
      <th className="px-6 py-4 font-bold tracking-wider">Action / Item</th>
      <th className="px-6 py-4 font-bold tracking-wider">Date</th>
      <th className="px-6 py-4 font-bold tracking-wider">Factory (Seller)</th>
      <th className="px-6 py-4 font-bold tracking-wider">Amount Paid/Bid</th>
      <th className="px-6 py-4 font-bold tracking-wider">Status</th>
    </tr>
  ) : role === 'company-buyer' ? (
    <tr>
      <th className="px-6 py-4 font-bold tracking-wider">Action / Material</th>
      <th className="px-6 py-4 font-bold tracking-wider">Date</th>
      <th className="px-6 py-4 font-bold tracking-wider">Source Factory</th>
      <th className="px-6 py-4 font-bold tracking-wider">Amount (LKR)</th>
      <th className="px-6 py-4 font-bold tracking-wider">Status</th>
    </tr>
  ) : (
    <tr>
      <th className="px-6 py-4 font-bold tracking-wider">Action / Item</th>
      <th className="px-6 py-4 font-bold tracking-wider">Date & Time</th>
      <th className="px-6 py-4 font-bold tracking-wider">Entity / Partner</th>
      <th className="px-6 py-4 font-bold tracking-wider">Value</th>
      <th className="px-6 py-4 font-bold tracking-wider">Status</th>
    </tr>
  );

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-industrial-400 uppercase bg-industrial-950/50 border-y border-industrial-800">
            {tableHeaders}
          </thead>
          <tbody>
            {displayData.map((item, i) => (
              <motion.tr 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.05 }}
                 key={item.id} 
                 className="border-b border-industrial-800 hover:bg-industrial-800/30 transition-colors group cursor-default"
              >
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-industrial-900 border border-industrial-700 shadow-sm flex items-center justify-center shrink-0 group-hover:bg-industrial-800 transition-colors">
                         {getIcon(item.type)}
                      </div>
                      <div>
                         <p className="font-bold text-white shadow-sm">{item.item}</p>
                         <p className="text-xs text-industrial-500">{item.type}</p>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-4 text-industrial-400 text-xs font-medium">{item.date}</td>
                <td className="px-6 py-4 text-industrial-300 font-medium">{item.partner}</td>
                <td className="px-6 py-4 font-mono font-bold text-white">{item.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-industrial-800 bg-industrial-950/30 text-center">
         <button className="text-sm font-bold text-nature-500 hover:text-nature-400 transition-colors py-2 px-6 rounded-xl hover:bg-nature-500/10 active:scale-95">
            View Complete Ledger &rarr;
         </button>
      </div>
    </div>
  );
}
