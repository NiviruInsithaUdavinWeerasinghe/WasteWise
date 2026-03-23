import React, { useState } from 'react';
import { Upload, CheckCircle, Loader, FileText, TrendingUp, AlertCircle, RefreshCw, Send, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { uploadFileToCloudinary } from '../services/cloudinaryService';

export default function UploadWizard() {
  const [status, setStatus] = useState('idle'); // idle, scanning, complete, details, submitting, success
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    weight: '',
    condition: 'Good',
    location: '',
    sellingMethod: 'auction',
    price: '',
    startingBid: '',
    minBidIncrease: '',
    description: '',
    endTime: '',
    pickupResponsibility: 'Buyer Arranges Pickup'
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setStatus('scanning');

      const data = new FormData();
      data.append('file', file);

      try {
        const [response, cloudResult] = await Promise.all([
          fetch('http://127.0.0.1:5001/predict', {
              method: 'POST',
              body: data,
          }),
          uploadFileToCloudinary(file)
        ]);

        const resData = await response.json();
        
        if (resData.error) throw new Error(resData.error);

        setImageUrl(cloudResult.secure_url);
        setAiResult(resData); 
        setStatus('complete');

      } catch (error) {
        console.error("Error processing file:", error);
        alert("Error: Could not scan or upload file. Ensure ML service is running and internet connection is stable.");
        setStatus('idle');
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitListing = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const materials = aiResult.breakdown
        .filter(item => item.confidence > 0.05)
        .map(item => `${item.material.replace('_', ' ')} ${(item.confidence * 100).toFixed(1)}%`)
        .join(', ');

      const payload = {
        wasteType: `${aiResult.top_prediction.material.replace('_', ' ')} (${materials})`,
        weight: Number(formData.weight),
        condition: aiResult.quality_grade || 'Grade B',
        location: formData.location,
        sellingMethod: formData.sellingMethod,
        price: formData.sellingMethod === 'direct' ? Number(formData.price) : undefined,
        startingBid: formData.sellingMethod === 'auction' ? Number(formData.startingBid) : undefined,
        minBidIncrease: formData.sellingMethod === 'auction' ? Number(formData.minBidIncrease || 0) : undefined,
        description: formData.description || undefined,
        endTime: formData.sellingMethod === 'auction' && formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
        pickupResponsibility: formData.pickupResponsibility,
        imageUrl: imageUrl
      };

      const response = await fetch('http://localhost:5000/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to create listing');
      }

      setStatus('success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert('Failed to submit listing. Please try again.');
      setStatus('details');
    }
  };

  const resetUpload = () => {
    setImage(null);
    setImageUrl(null);
    setAiResult(null);
    setFormData({
      weight: '',
      condition: 'Good',
      location: '',
      sellingMethod: 'auction',
      price: '',
      startingBid: '',
      minBidIncrease: '',
      description: '',
      endTime: '',
      pickupResponsibility: 'Buyer Arranges Pickup'
    });
    setStatus('idle');
  }

  const getEstimatedPrice = (material) => {
    const prices = {
      'Silk': '450.00',
      'Leather': '500.00',
      'Satin': '400.00',
      'Suede': '380.00',
      'Wool': '350.00',
      'Velvet': '300.00',
      'Artificial_leather': '250.00',
      'Linen': '200.00',
      'Denim': '180.00',
      'Cotton': '150.00',
      'Viscose': '140.00',
      'Fleece': '130.00',
      'Nylon': '110.00',
      'Polyester': '100.00',
      'Acrylic': '90.00'
    };
    return prices[material] || '120.00';
  };

  return (
    <div className="max-w-2xl mx-auto bg-industrial-900 rounded-2xl shadow-2xl border border-industrial-800 overflow-hidden max-h-[90vh] overflow-y-auto">
      <div className="bg-industrial-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-industrial-800">
        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
          <Upload size={20} className="text-nature-400" />
          Waste Identification Portal
        </h2>
        {status === 'scanning' && (
           <span className="text-xs font-mono text-nature-300 animate-pulse">Running ResNet50V2...</span>
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
              <div className="border-2 border-dashed border-industrial-700 rounded-xl p-12 hover:border-nature-500 hover:bg-industrial-800/50 transition-all cursor-pointer relative bg-industrial-950/30">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="bg-industrial-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-industrial-400 border border-industrial-700">
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-medium text-white">Drop waste photo here</h3>
                <p className="text-sm text-industrial-500 mt-2">or click to browse (Supports JPG, PNG)</p>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-nature-500/10 text-nature-400 rounded-full text-xs font-medium border border-nature-500/20">
                  <AlertCircle size={14} />
                  AI Model v2.0 Connected
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
                  className="absolute inset-0 border-4 border-industrial-800 rounded-full"
                />
                <motion.div 
                  className="absolute inset-0 border-4 border-nature-500 rounded-full border-t-transparent shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Loader size={32} className="text-nature-500" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Analyzing Material Structure...</h3>
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
                    <img src={image} alt="Waste" className="w-32 h-32 object-cover rounded-lg border border-industrial-700 shadow-md" />
                )}
                <div className="flex-1">
                   <div className="flex items-center gap-2 text-nature-500 font-bold text-sm mb-1">
                      <CheckCircle size={16} />
                      Analysis Complete
                   </div>
                   <h3 className="text-2xl font-bold text-white capitalize">
                      {aiResult.top_prediction.material.replace('_', ' ')} Dominant
                   </h3>
                   
                   <div className="mt-4 space-y-3">
                      <p className="text-xs font-semibold text-industrial-400 uppercase tracking-wider">Material Composition</p>
                      {aiResult.breakdown.map((item, index) => (
                          item.confidence > 0.05 && (
                            <div key={index} className="w-full">
                              <div className="flex justify-between text-xs mb-1">
                                  <span className="capitalize font-medium text-industrial-300">{item.material.replace('_', ' ')}</span>
                                  <span className="text-industrial-400">{(item.confidence * 100).toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-industrial-800 rounded-full h-2">
                                  <div 
                                     className={`h-2 rounded-full ${index === 0 ? 'bg-nature-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-industrial-500'}`} 
                                     style={{ width: `${item.confidence * 100}%` }}
                                  ></div>
                              </div>
                            </div>
                          )
                      ))}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-nature-500/10 p-4 rounded-xl border border-nature-500/20">
                  <div className="text-nature-500 text-sm font-medium mb-1">Confidence Score</div>
                  <div className="text-2xl font-bold text-nature-400">
                      {(aiResult.top_prediction.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-nature-500/80 mt-1">Match Accuracy</div>
                </div>
                <div className="bg-industrial-950 p-4 rounded-xl border border-industrial-800 shadow-inner">
                   <div className="text-industrial-400 text-sm font-medium mb-1 flex items-center gap-1">
                      <TrendingUp size={14} /> Est. Market Value
                   </div>
                   <div className="text-2xl font-bold text-white">
                      {getEstimatedPrice(aiResult.top_prediction.material)} 
                      <span className="text-sm text-industrial-500 font-normal ml-1">LKR/kg</span>
                   </div>
                </div>
                <div className="bg-industrial-950 p-4 rounded-xl border border-nature-500/40 shadow-inner relative overflow-hidden">
                   <div className="absolute top-0 right-0 -mt-2 -mr-2 opacity-5 text-nature-500">
                     <Star size={64} />
                   </div>
                   <div className="text-industrial-400 text-sm font-medium mb-1 flex items-center gap-1">
                      <Star size={14} className="text-nature-500" /> AI Quality Grade
                   </div>
                   <div className="text-2xl font-bold text-white relative z-10">
                      {aiResult.quality_grade || 'Grade B'}
                   </div>
                   <div className="text-xs text-nature-400 mt-1">Gemini 1.5 Vision</div>
                </div>
              </div>

              <div className="flex gap-3">
                 <button onClick={() => setStatus('details')} className="flex-1 bg-nature-600 text-white font-bold py-3 rounded-lg hover:bg-nature-500 transition-colors shadow-lg shadow-nature-900/50 capitalize">
                    Proceed to Listing Details
                 </button>
                 <button onClick={resetUpload} className="flex items-center justify-center gap-2 px-6 py-3 border border-industrial-700 text-industrial-400 font-medium rounded-lg hover:bg-industrial-800 hover:text-white transition-colors">
                    <RefreshCw size={18} />
                    Scan Again
                 </button>
              </div>
            </motion.div>
          )}

          {status === 'details' && (
            <motion.form
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={submitListing}
              className="text-left space-y-3"
            >
              <h3 className="text-xl font-bold text-white mb-4">Complete Listing Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-industrial-400 mb-1">Weight (kg)</label>
                  <input type="number" name="weight" required value={formData.weight} onChange={handleInputChange} className="w-full bg-industrial-950 border border-industrial-800 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-nature-500 outline-none text-white placeholder-industrial-600 shadow-inner" min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-nature-500 mb-1 flex items-center gap-1 cursor-help" title="Condition is automatically determined by Gemini V1.5">
                     <Star size={14}/> AI Verified Condition
                  </label>
                  <input type="text" readOnly value={aiResult?.quality_grade || 'Grade B'} className="w-full bg-industrial-950/50 border border-nature-500/30 rounded-lg py-1.5 px-3 outline-none text-nature-400 font-bold shadow-inner cursor-not-allowed" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-industrial-400 mb-1">Location</label>
                <input type="text" name="location" required value={formData.location} onChange={handleInputChange} placeholder="e.g. Colombo, Sri Lanka" className="w-full bg-industrial-950 border border-industrial-800 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-nature-500 outline-none text-white placeholder-industrial-600 shadow-inner" />
              </div>

              <div>
                <label className="block text-sm font-medium text-industrial-400 mb-1">Selling Method</label>
                <select name="sellingMethod" value={formData.sellingMethod} onChange={handleInputChange} className="w-full bg-industrial-950 border border-industrial-800 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-nature-500 outline-none text-white shadow-inner">
                  <option value="auction">Auction (Bidding)</option>
                  <option value="direct">Direct Sale (Fixed Price)</option>
                </select>
              </div>

              {formData.sellingMethod === 'auction' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-industrial-400 mb-1">Starting Bid (LKR)</label>
                      <input type="number" name="startingBid" required value={formData.startingBid} onChange={handleInputChange} className="w-full bg-industrial-950 border border-industrial-800 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-nature-500 outline-none text-white placeholder-industrial-600 shadow-inner" min="1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-industrial-400 mb-1">Min Bid Increase</label>
                      <input type="number" name="minBidIncrease" required value={formData.minBidIncrease} onChange={handleInputChange} className="w-full bg-industrial-950 border border-industrial-800 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-nature-500 outline-none text-white placeholder-industrial-600 shadow-inner" min="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-industrial-400 mb-1">Auction Deadline</label>
                    <input type="datetime-local" name="endTime" required value={formData.endTime} onChange={handleInputChange} className="w-full bg-industrial-950 border border-industrial-800 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-nature-500 outline-none text-white placeholder-industrial-600 shadow-inner [color-scheme:dark]" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-industrial-400 mb-1">Fixed Price (LKR)</label>
                  <input type="number" name="price" required value={formData.price} onChange={handleInputChange} className="w-full bg-industrial-950 border border-industrial-800 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-nature-500 outline-none text-white placeholder-industrial-600 shadow-inner" min="1" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-industrial-400 mb-1">Pickup Responsibility</label>
                <select name="pickupResponsibility" value={formData.pickupResponsibility} onChange={handleInputChange} className="w-full bg-industrial-950 border border-industrial-800 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-nature-500 outline-none text-white shadow-inner">
                  <option value="Buyer Arranges Pickup">Buyer Arranges Pickup</option>
                  <option value="Seller Delivers">Seller Delivers</option>
                  <option value="Platform Logistics">Platform Logistics</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-industrial-400 mb-1">Description (Optional)</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Additional details about the waste..." className="w-full bg-industrial-950 border border-industrial-800 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-nature-500 outline-none text-white placeholder-industrial-600 shadow-inner h-16 resize-none" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-industrial-800">
                 <button type="submit" className="flex-1 bg-nature-600 text-white font-bold py-3 rounded-lg hover:bg-nature-500 transition-colors shadow-lg flex justify-center items-center gap-2">
                    <Send size={18} /> Publish Listing
                 </button>
                 <button type="button" onClick={() => setStatus('complete')} className="px-5 py-3 border border-industrial-700 text-industrial-400 font-medium rounded-lg hover:bg-industrial-800 hover:text-white transition-colors">
                    Back
                 </button>
              </div>
            </motion.form>
          )}

           {status === 'submitting' && (
             <motion.div
               key="submitting"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-center py-12"
             >
               <Loader size={32} className="text-nature-500 animate-spin mx-auto mb-4" />
               <h3 className="text-lg font-medium text-white">Publishing to Marketplace...</h3>
             </motion.div>
          )}

          {status === 'success' && (
             <motion.div
               key="success"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center py-12"
             >
               <div className="w-16 h-16 bg-nature-500/20 text-nature-400 border border-nature-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">Listing Published!</h3>
               <p className="text-industrial-400 mb-8">Your waste material is now live on the marketplace.</p>
               
               <div className="flex items-center justify-center gap-2 text-nature-400 text-sm">
                  <Loader size={16} className="animate-spin" />
                  <span>Redirecting to dashboard...</span>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}