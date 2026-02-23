import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardChart({ title }) {
  const chartData = [
    { day: 'Mon', transactions: 420, newUsers: 120 },
    { day: 'Tue', transactions: 510, newUsers: 145 },
    { day: 'Wed', transactions: 480, newUsers: 110 },
    { day: 'Thu', transactions: 650, newUsers: 180 },
    { day: 'Fri', transactions: 720, newUsers: 210 },
    { day: 'Sat', transactions: 490, newUsers: 160 },
    { day: 'Sun', transactions: 530, newUsers: 190 },
  ];

  const maxTransactions = Math.max(...chartData.map(d => d.transactions));
  const maxNewUsers = Math.max(...chartData.map(d => d.newUsers));
  
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="bg-transparent p-0 flex flex-col h-[280px] w-full">
      <div className="flex justify-between items-center">
         <h3 className="text-white font-bold">{title}</h3>
         <div className="flex gap-4 text-xs font-bold text-industrial-400">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-nature-500"></span> Transactions</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> New Users</div>
         </div>
      </div>
      
      <div className="flex-1 flex items-end justify-between gap-2 relative mt-4">
        {/* Y-axis guiding lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
           <div className="border-b border-dashed border-industrial-700 w-full h-0"></div>
           <div className="border-b border-dashed border-industrial-700 w-full h-0"></div>
           <div className="border-b border-dashed border-industrial-700 w-full h-0"></div>
           <div className="border-b border-solid border-industrial-700 w-full h-0"></div>
        </div>

        {chartData.map((data, i) => {
          const transHeight = (data.transactions / maxTransactions) * 100;
          const userHeight = (data.newUsers / maxNewUsers) * 100;

          return (
            <div 
              key={i} 
              className="relative flex-1 flex flex-col justify-end items-center group cursor-pointer z-10"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
               {/* Tooltip */}
               <AnimatePresence>
                 {hoveredIndex === i && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="absolute -top-16 bg-industrial-950 text-white p-2 rounded-lg text-xs whitespace-nowrap shadow-xl z-20 pointer-events-none border border-industrial-800"
                   >
                      <p className="font-bold mb-1 border-b border-industrial-800 pb-1">{data.day}</p>
                      <p className="flex items-center gap-1"><span className="w-2 h-2 bg-nature-500 rounded-full"></span> {data.transactions} Txns</p>
                      <p className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> {data.newUsers} Users</p>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Bars */}
               <div className="w-full flex justify-center gap-1 items-end h-[200px]">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${transHeight}%` }}
                    transition={{ type: "spring", bounce: 0.2, duration: 1, delay: i * 0.05 }}
                    className={`w-full max-w-[24px] bg-gradient-to-t from-nature-600 to-nature-400 rounded-t-xl transition-opacity duration-300 ${hoveredIndex !== null && hoveredIndex !== i ? 'opacity-30' : 'opacity-100'}`}
                  />
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${userHeight}%` }}
                    transition={{ type: "spring", bounce: 0.2, duration: 1, delay: i * 0.05 + 0.1 }}
                    className={`w-full max-w-[24px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl transition-opacity duration-300 ${hoveredIndex !== null && hoveredIndex !== i ? 'opacity-30' : 'opacity-100'}`}
                  />
               </div>
               
               {/* X-axis Label */}
               <span className={`text-xs font-bold mt-4 transition-colors ${hoveredIndex === i ? 'text-white' : 'text-industrial-500'}`}>
                 {data.day}
               </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
