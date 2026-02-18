import React, { useState } from 'react';
import { Upload, CheckCircle, Loader, FileText, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadWizard() {
  const [status, setStatus] = useState('idle'); // idle, scanning, complete
  const [image, setImage] = useState(null);
  const [aiResult, setAiResult] = useState(null); // To store the real answer from Python

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Show the preview immediately
      setImage(URL.createObjectURL(file));
      setStatus('scanning');

      // 2. Prepare the file to send to Python
      const formData = new FormData();
      formData.append('file', file);

      try {
        // 3. Send to your Flask API (Make sure app.py is running!)
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        // 4. Save the real result
        setAiResult(data); 
        setStatus('complete');

      } catch (error) {
        console.error("Error connecting to AI:", error);
        alert("Error: Could not connect to the AI Brain. Is the black Python window running?");
        setStatus('idle');
      }
    }
  };

  const resetUpload = () => {
    setImage(null);
    setAiResult(null);
    setStatus('idle');
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-industrial-100 overflow-hidden">
      <div className="bg-industrial-900 px-6 py-4 flex justify-between items-center">
        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
          <Upload size={20} className="text-nature-400" />
          Waste Identification Portal
        </h2>
        {status === 'scanning' && (
           <span className="text-xs font-mono text-nature-300 animate-pulse">Running TensorFlow Lite...</span>
        )}
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="border-2 border-dashed border-industrial-200 rounded-xl p-12 hover:border-nature-500 hover:bg-nature-50 transition-all cursor-pointer relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="bg-industrial-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-industrial-500">
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-medium text-industrial-900">Drop waste photo here</h3>
                <p className="text-sm text-industrial-500 mt-2">or click to browse (Supports JPG, PNG)</p>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-nature-100 text-nature-700 rounded-full text-xs font-medium">
                  <AlertCircle size={14} />
                  AI Model v1.0 Connected
                </div>
              </div>
            </motion.div>
          )}

          {status === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <motion.div 
                  className="absolute inset-0 border-4 border-industrial-100 rounded-full"
                />
                <motion.div 
                  className="absolute inset-0 border-4 border-nature-500 rounded-full border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Loader size={32} className="text-nature-600" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-industrial-900 mb-2">Analyzing Material Structure...</h3>
              <p className="text-industrial-500 text-sm">Communicating with Python ML Service...</p>
            </motion.div>
          )}


{status === 'complete' && aiResult && (
  <motion.div
    key="complete"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-left"
  >
    <div className="flex gap-6 mb-8">
      {image && (
          <img src={image} alt="Waste" className="w-32 h-32 object-cover rounded-lg border border-industrial-200 shadow-sm" />
      )}
      <div className="flex-1">
         <div className="flex items-center gap-2 text-nature-600 font-bold text-sm mb-1">
            <CheckCircle size={16} />
            Analysis Complete
         </div>
         <h3 className="text-2xl font-bold text-industrial-900 capitalize">
            {aiResult.top_prediction.material} Dominant
         </h3>
         
         {/* NEW: Material Composition Bars */}
         <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold text-industrial-500 uppercase tracking-wider">Material Composition</p>
            {aiResult.breakdown.map((item, index) => (
                // Only show materials with > 5% confidence to reduce noise
                item.confidence > 0.05 && (
                  <div key={index} className="w-full">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize font-medium text-industrial-700">{item.material}</span>
                        <span className="text-industrial-500">{(item.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-industrial-100 rounded-full h-2">
                        <div 
                           className={`h-2 rounded-full ${index === 0 ? 'bg-nature-500' : 'bg-industrial-400'}`} 
                           style={{ width: `${item.confidence * 100}%` }}
                        ></div>
                    </div>
                  </div>
                )
            ))}
         </div>
      </div>
    </div>

    {/* Price Estimation based on Top Result */}
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="bg-nature-50 p-4 rounded-xl border border-nature-100">
        <div className="text-nature-600 text-sm font-medium mb-1">Confidence Score</div>
        <div className="text-2xl font-bold text-nature-800">
            {(aiResult.top_prediction.confidence * 100).toFixed(0)}%
        </div>
        <div className="text-xs text-nature-600 mt-1">Match Accuracy</div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-industrial-200">
         <div className="text-industrial-500 text-sm font-medium mb-1 flex items-center gap-1">
            <TrendingUp size={14} /> Est. Market Value
         </div>
         <div className="text-2xl font-bold text-industrial-900">
            {/* Simple price logic */}
            {aiResult.top_prediction.material === 'silk_satin' ? '450.00' 
              : aiResult.top_prediction.material === 'denim' ? '180.00' 
              : '120.00'} 
            <span className="text-sm text-industrial-400 font-normal ml-1">LKR/kg</span>
         </div>
      </div>
    </div>

    <div className="flex gap-3">
       <button className="flex-1 bg-nature-600 text-white font-medium py-3 rounded-lg hover:bg-nature-700 transition-colors shadow-lg shadow-nature-200">
          List as {aiResult.top_prediction.material}
       </button>
       <button onClick={resetUpload} className="flex items-center justify-center gap-2 px-6 py-3 border border-industrial-200 text-industrial-600 font-medium rounded-lg hover:bg-industrial-50 transition-colors">
          <RefreshCw size={18} />
          Scan Again
       </button>
    </div>
  </motion.div>
)}
        </AnimatePresence>
      </div>
    </div>
  );
}