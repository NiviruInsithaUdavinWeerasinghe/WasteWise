import React from 'react';
import DashboardChart from '../components/DashboardChart.js';
import HistoryTable from '../components/HistoryTable.js';
import { Users, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

export default function AdminDashboard() {
  const customStats = [
    { label: 'Pending Verifications', val: '12', icon: AlertTriangle, color: 'text-orange-500' },
    { label: 'Active Users', val: '1,240', icon: Users, color: 'text-blue-500' },
    { label: 'Certificates Issued', val: '8,500', icon: Shield, color: 'text-nature-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {customStats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-industrial-200 flex items-center justify-between">
            <div>
              <p className="text-industrial-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-3xl font-bold text-industrial-900 mt-1">{stat.val}</h3>
            </div>
            <div className={`p-3 rounded-full bg-industrial-50 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChart title="Platform Traffic" />
        <div className="bg-white p-6 rounded-xl shadow-sm border border-industrial-200">
           <h3 className="font-bold mb-4">Verification Queue</h3>
           <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center justify-between p-3 border border-industrial-100 rounded-lg">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-industrial-100 rounded-full flex items-center justify-center text-industrial-600 font-bold">F{i}</div>
                      <div>
                        <div className="font-medium text-sm">Factory #{200+i} Reg Request</div>
                        <div className="text-xs text-industrial-500">Submitted 2h ago</div>
                      </div>
                   </div>
                   <button className="text-xs bg-industrial-900 text-white px-3 py-1.5 rounded-lg">Review</button>
                </div>
              ))}
           </div>
        </div>
      </div>

      <HistoryTable role="admin" />
    </div>
  );
}
