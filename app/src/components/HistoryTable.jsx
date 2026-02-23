import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function HistoryTable({ role }) {
  // Mock Data based on role
  const historyData = [
    { id: 1, type: 'Sale', item: 'Cotton Offcuts 500kg', date: '2025-10-15', amount: '45,000 LKR', status: 'Completed', partner: 'EcoRecycle Pvt Ltd' },
    { id: 2, type: 'Bid', item: 'Polyester Rolls', date: '2025-10-18', amount: '12,500 LKR', status: 'Pending', partner: 'TexFab Lanka' },
    { id: 3, type: 'Certificate', item: 'Green Cert #4021', date: '2025-10-14', amount: '-', status: 'Verified', partner: 'WasteWise Authority' },
    { id: 4, type: 'Sale', item: 'Denim Scraps', date: '2025-10-10', amount: '88,000 LKR', status: 'Completed', partner: 'Global Fibers' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-industrial-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-industrial-100 flex justify-between items-center bg-industrial-50/50">
        <h3 className="font-bold text-industrial-900">Activity History</h3>
        <button className="text-sm text-nature-600 font-medium hover:text-nature-700">View All</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-industrial-500 uppercase bg-industrial-50">
            <tr>
              <th className="px-6 py-3">Transaction</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Partner</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {historyData.map((item) => (
              <tr key={item.id} className="border-b border-industrial-100 last:border-0 hover:bg-industrial-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-industrial-900 flex items-center gap-2">
                   {item.type === 'Sale' ? <ArrowUpRight size={16} className="text-nature-500" /> : 
                    item.type === 'Bid' ? <ArrowDownLeft size={16} className="text-orange-500" /> :
                    <CheckCircle size={16} className="text-blue-500" />}
                   {item.item}
                </td>
                <td className="px-6 py-4 text-industrial-500">{item.date}</td>
                <td className="px-6 py-4 text-industrial-600">{item.partner}</td>
                <td className="px-6 py-4 font-mono font-medium">{item.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                    ${item.status === 'Completed' ? 'bg-nature-100 text-nature-800 border-nature-200' : 
                      item.status === 'Pending' ? 'bg-orange-100 text-orange-800 border-orange-200' : 
                      item.status === 'Verified' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-red-100 text-red-800 border-red-200'}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
