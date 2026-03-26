import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardChart({ 
  title, 
  data = [], 
  series1Name = "Series 1", 
  series2Name = "Series 2",
  series1Key = "val1",
  series2Key = "val2"
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-transparent flex flex-col h-full w-full justify-center items-center text-industrial-500 border border-dashed border-industrial-800 rounded-xl">
        <p className="text-xs font-bold uppercase tracking-widest italic">No data available yet</p>
      </div>
    );
  }

  const maxVal1 = Math.max(...data.map(d => d[series1Key] || 0), 1);
  const maxVal2 = Math.max(...data.map(d => d[series2Key] || 0), 1);

  return (
    <div className="bg-transparent p-0 flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-1">
         <h3 className="text-white font-bold">{title}</h3>
         <div className="flex gap-4 text-[10px] font-bold text-industrial-400 uppercase tracking-widest">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-nature-500"></span> {series1Name}</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> {series2Name}</div>
         </div>
      </div>
      
      <div className="flex-1 flex items-end justify-between gap-1 relative mt-8">
        {/* Y-axis guiding lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-6">
           <div className="border-b border-dashed border-industrial-700 w-full h-0"></div>
           <div className="border-b border-dashed border-industrial-700 w-full h-0"></div>
           <div className="border-b border-dashed border-industrial-700 w-full h-0"></div>
           <div className="border-b border-solid border-industrial-700 w-full h-0"></div>
        </div>

        {data.map((item, i) => {
          const h1 = ((item[series1Key] || 0) / maxVal1) * 100;
          const h2 = ((item[series2Key] || 0) / maxVal2) * 100;

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
                     initial={{ opacity: 0, y: 10, scale: 0.9 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="absolute -top-16 bg-industrial-950 text-white p-2.5 rounded-xl text-[10px] font-bold whitespace-nowrap shadow-2xl z-20 pointer-events-none border border-industrial-800"
                   >
                      <p className="text-industrial-400 mb-1.5 border-b border-industrial-800 pb-1 uppercase tracking-tighter">{item.label}</p>
                      <p className="flex items-center justify-between gap-4 mb-1">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-nature-500 rounded-sm"></span> {series1Name}</span>
                        <span className="text-white">{item[series1Key].toLocaleString()}</span>
                      </p>
                      <p className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-sm"></span> {series2Name}</span>
                        <span className="text-white">{item[series2Key].toLocaleString()}</span>
                      </p>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Bars Container */}
               <div className="w-full flex justify-center gap-1 items-end h-[220px] pb-1">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(h1, 5)}%` }}
                    transition={{ type: "spring", bounce: 0.2, duration: 1, delay: i * 0.05 }}
                    className={`w-full max-w-[12px] bg-gradient-to-t from-nature-600 to-nature-400 rounded-t-sm transition-opacity duration-300 ${hoveredIndex !== null && hoveredIndex !== i ? 'opacity-30' : 'opacity-100'}`}
                  />
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(h2, 5)}%` }}
                    transition={{ type: "spring", bounce: 0.2, duration: 1, delay: i * 0.05 + 0.1 }}
                    className={`w-full max-w-[12px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-opacity duration-300 ${hoveredIndex !== null && hoveredIndex !== i ? 'opacity-30' : 'opacity-100'}`}
                  />
               </div>
               
               {/* X-axis Label */}
               <span className={`text-[10px] font-black mt-3 transition-colors uppercase tracking-tighter ${hoveredIndex === i ? 'text-white' : 'text-industrial-600'}`}>
                 {item.label}
               </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
