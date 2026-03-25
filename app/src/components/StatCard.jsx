import React from 'react';
import { motion } from 'framer-motion';

const countUpVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1]
    }
  })
};

export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  color = "nature", 
  percentage, 
  index = 0,
  isSplit = false,
  secondHalf = null
}) {
  const colorMap = {
    nature: 'text-nature-500 bg-nature-500/10 border-nature-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  };

  const selectedColor = colorMap[color] || colorMap.nature;

  if (isSplit && secondHalf) {
    return (
      <motion.div
        variants={countUpVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="md:col-span-1 bg-industrial-900 rounded-2xl shadow-xl border border-industrial-800 overflow-hidden flex group"
      >
        {/* Left Half */}
        <div className="flex-1 p-6 border-r border-industrial-800/50 hover:bg-industrial-800/30 transition-colors">
          <div className={`flex items-center gap-2 mb-3 ${selectedColor.split(' ')[0]}`}>
            <Icon size={18} className="drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]" /> 
            <span className="font-bold text-[10px] uppercase tracking-wider">{label}</span>
          </div>
          <div className="text-xl font-extrabold text-white leading-none mb-1 group-hover:scale-105 transition-transform origin-left duration-300">{value}</div>
          <div className="text-[10px] text-industrial-500 font-medium uppercase tracking-tight">{subValue}</div>
        </div>

        {/* Right Half */}
        <div className="flex-1 p-6 bg-nature-500/5 relative overflow-hidden hover:bg-nature-500/10 transition-all duration-300">
          <div className="relative z-10">
            <secondHalf.icon size={18} className="text-nature-500 mb-3" />
            <div className="text-xl font-extrabold text-white leading-none mb-1 group-hover:scale-105 transition-transform origin-left duration-300">{secondHalf.value}</div>
            <div className="text-[10px] text-industrial-400 font-medium uppercase tracking-tight">{secondHalf.label}</div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 group-hover:opacity-20 transition-all duration-700 pointer-events-none">
            <secondHalf.icon size={80} />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={countUpVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={{ 
        y: -4, 
        backgroundColor: 'rgba(31, 41, 55, 0.8)', // slightly lighter bg on hover
        transition: { duration: 0.2 } 
      }}
      className="bg-industrial-900 p-6 rounded-2xl shadow-xl border border-industrial-800 relative overflow-hidden group transition-all duration-300"
    >
      <div className="relative z-10">
        <div className={`flex items-center gap-3 mb-4 ${selectedColor.split(' ')[0]}`}>
          <div className={`p-2 rounded-lg ${selectedColor.split(' ').slice(1).join(' ')} group-hover:scale-110 transition-transform duration-300`}>
             <Icon size={20} />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-widest">{label}</span>
        </div>
        
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-extrabold text-white tracking-tight group-hover:translate-x-1 transition-transform duration-300">{value}</div>
          {percentage && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${percentage > 0 ? 'bg-nature-500/10 text-nature-400' : 'bg-red-500/10 text-red-400'}`}>
              {percentage > 0 ? '+' : ''}{percentage}%
            </span>
          )}
        </div>
        
        {subValue && (
          <div className="text-[10px] text-industrial-500 mt-2 font-bold uppercase tracking-tight flex items-center gap-1.5">
             <div className={`w-1 h-1 rounded-full ${selectedColor.split(' ')[0].replace('text-', 'bg-')}`} />
             {subValue}
          </div>
        )}
      </div>

      {/* Decorative background element */}
      <div className={`absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-125 transition-all duration-700 pointer-events-none ${selectedColor.split(' ')[0]}`}>
        <Icon size={120} />
      </div>
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
}
