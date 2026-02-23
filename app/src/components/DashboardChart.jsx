import React from 'react';
import { motion } from 'framer-motion';

export default function DashboardChart({ title }) {
  const data = [40, 70, 45, 90, 65, 80, 55];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-industrial-200">
      <h3 className="text-industrial-900 font-bold mb-6">{title}</h3>
      <div className="flex items-end justify-between h-48 gap-2">
        {data.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
             <div className="relative w-full h-full flex items-end">
               <motion.div 
                 initial={{ height: 0 }}
                 animate={{ height: `${h}%` }}
                 transition={{ duration: 1, delay: i * 0.1 }}
                 className="w-full bg-nature-100 rounded-t-md group-hover:bg-nature-200 transition-colors relative"
               >
                 {/* Inner bar for variety */}
                 <div className="absolute bottom-0 left-0 right-0 bg-nature-500 rounded-t-md opacity-80" style={{ height: '60%' }}></div>
               </motion.div>
             </div>
             <span className="text-xs text-industrial-400 font-medium">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
