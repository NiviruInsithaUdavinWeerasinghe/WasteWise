import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSignature, Upload, CheckCircle, Clock, Info, ShieldCheck } from 'lucide-react';
import { uploadFileToCloudinary } from '../services/cloudinaryService';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function ContractNegotiation({ isOpen, onClose, contractId, onUpdate }) {
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    wasteType: '',
    monthlyQuantityKg: 0,
    pricePerKg: 0,
    durationMonths: 0,
    customTerms: ''
  });

  useEffect(() => {
    if (isOpen && contractId) fetchContract();
  }, [isOpen, contractId]);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/my-contracts`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const found = data.find(c => c._id === contractId);
        if (found) {
          setContract(found);
          setFormData({
            wasteType: found.wasteType,
            monthlyQuantityKg: found.monthlyQuantityKg,
            pricePerKg: found.pricePerKg,
            durationMonths: found.durationMonths,
            customTerms: found.customTerms
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch contract:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setIsEditing(false);
        fetchContract();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Failed to edit contract:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { secure_url } = await uploadFileToCloudinary(file);
      const role = user.role.includes('buyer') ? 'buyer' : 'seller';
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ signatureUrl: secure_url, role })
      });
      if (response.ok) {
        fetchContract();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error("Signature upload failed:", error);
      alert("Failed to upload signature. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleEstablish = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/contracts/${contractId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.ok) {
        fetchContract();
        if (onUpdate) onUpdate();
        onClose();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to establish contract");
      }
    } catch (error) {
      console.error("Establishment failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const isProposer = contract?.proposerId._id === user.id || contract?.proposerId === user.id;
  const isReceiver = contract?.receiverId._id === user.id || contract?.receiverId === user.id;
  const hasUserConfirmed = isProposer ? contract?.proposerConfirmed : contract?.receiverConfirmed;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-industrial-950/90 backdrop-blur-xl"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-50 bg-industrial-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-industrial-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-industrial-800 flex justify-between items-center bg-industrial-950/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-nature-500/10 rounded-xl text-nature-500 border border-nature-500/20">
                  <FileSignature size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Contract Negotiation</h2>
                  <p className="text-industrial-400 text-xs">Review, edit, and sign your long-term waste supply agreement.</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-industrial-800 rounded-full text-industrial-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {!contract ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Clock className="text-nature-500 animate-pulse mb-4" size={40} />
                  <p className="text-industrial-400 font-bold text-sm">Loading contract details...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Agreement Terms */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                        <ShieldCheck size={18} className="text-nature-500" /> Agreement Terms
                      </h3>
                      {!isEditing && contract.status === 'pending_signature' && (
                        <button onClick={() => setIsEditing(true)} className="text-nature-500 hover:text-nature-400 text-xs font-bold transition-colors">
                          Edit Terms
                        </button>
                      )}
                    </div>

                    <div className="bg-industrial-950/50 rounded-2xl border border-industrial-800 p-5 space-y-5">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-industrial-400 uppercase mb-1.5">Material Type</label>
                            <input type="text" value={formData.wasteType} onChange={e => setFormData({ ...formData, wasteType: e.target.value })}
                              className="w-full bg-industrial-900 border border-industrial-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nature-500/50 transition-colors" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-industrial-400 uppercase mb-1.5">Monthly Qty (Kg)</label>
                              <input type="number" value={formData.monthlyQuantityKg} onChange={e => setFormData({ ...formData, monthlyQuantityKg: parseInt(e.target.value) })}
                                className="w-full bg-industrial-900 border border-industrial-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nature-500/50" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-industrial-400 uppercase mb-1.5">Price (LKR/Kg)</label>
                              <input type="number" value={formData.pricePerKg} onChange={e => setFormData({ ...formData, pricePerKg: parseFloat(e.target.value) })}
                                className="w-full bg-industrial-900 border border-industrial-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nature-500/50" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-industrial-400 uppercase mb-1.5">Duration (Months)</label>
                            <input type="number" value={formData.durationMonths} onChange={e => setFormData({ ...formData, durationMonths: parseInt(e.target.value) })}
                              className="w-full bg-industrial-900 border border-industrial-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nature-500/50" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-industrial-400 uppercase mb-1.5">Custom Terms</label>
                            <textarea rows="4" value={formData.customTerms} onChange={e => setFormData({ ...formData, customTerms: e.target.value })}
                              className="w-full bg-industrial-900 border border-industrial-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-nature-500/50 resize-none" />
                          </div>
                          <div className="flex gap-3 pt-1">
                            <button onClick={handleEdit} className="flex-1 bg-nature-600 hover:bg-nature-500 text-white text-sm font-bold py-2.5 rounded-xl transition-all">Save Changes</button>
                            <button onClick={() => setIsEditing(false)} className="flex-1 bg-industrial-800 hover:bg-industrial-700 text-white text-sm font-bold py-2.5 rounded-xl transition-all">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {[
                            ['Material', contract.wasteType],
                            ['Quantity', `${contract.monthlyQuantityKg} KG/Month`],
                            ['Duration', `${contract.durationMonths} Months`],
                            ['Unit Price', `LKR ${contract.pricePerKg}/kg`],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-center py-1 border-b border-industrial-800/50">
                              <span className="text-industrial-400 text-xs">{label}</span>
                              <span className="text-white font-bold text-sm">{value}</span>
                            </div>
                          ))}
                          {contract.customTerms && (
                            <div className="pt-2">
                              <p className="text-xs font-bold text-industrial-400 uppercase mb-2">Custom Terms</p>
                              {/* Fix: break-words prevents overflow on long unbroken strings */}
                              <p className="text-xs text-industrial-300 leading-relaxed bg-industrial-900/50 p-3 rounded-xl border border-industrial-800 break-words whitespace-pre-wrap max-h-28 overflow-y-auto custom-scrollbar">
                                {contract.customTerms}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Signatures */}
                  <div className="space-y-6">
                    <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                      <CheckCircle size={18} className="text-nature-500" /> Digital Signatures
                    </h3>

                    {/* Buyer Sig */}
                    <SigBox
                      label="Buyer Signature"
                      sublabel="Recycler / Procurement Team"
                      sigUrl={contract.buyerSignatureUrl}
                      canUpload={user.role.includes('buyer')}
                      uploading={uploading}
                      onUpload={handleSignatureUpload}
                      isConfirmed={contract.proposerId.role === 'company-buyer' ? contract.proposerConfirmed : contract.receiverConfirmed}
                    />

                    {/* Seller Sig */}
                    <SigBox
                      label="Seller Signature"
                      sublabel="Factory / Operations Head"
                      sigUrl={contract.sellerSignatureUrl}
                      canUpload={user.role.includes('seller')}
                      uploading={uploading}
                      onUpload={handleSignatureUpload}
                      isConfirmed={contract.proposerId.role === 'company-seller' ? contract.proposerConfirmed : contract.receiverConfirmed}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-industrial-800 bg-industrial-950/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex items-start gap-2 max-w-md">
                <Info size={16} className="text-industrial-500 shrink-0 mt-0.5" />
                <p className="text-xs text-industrial-400 leading-relaxed">
                  {contract?.status === 'active' 
                    ? "This contract is active and legally binding." 
                    : "Both parties must sign and establish the contract. Establishing the contract constitutes shared legal agreement."}
                </p>
              </div>
              <button
                disabled={loading || !contract?.buyerSignatureUrl || !contract?.sellerSignatureUrl || contract?.status === 'active' || hasUserConfirmed}
                onClick={handleEstablish}
                className={`w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-xl active:scale-95 whitespace-nowrap ${
                  (!contract?.buyerSignatureUrl || !contract?.sellerSignatureUrl || contract?.status === 'active' || hasUserConfirmed)
                    ? 'bg-industrial-800 text-industrial-500 cursor-not-allowed'
                    : 'bg-nature-600 hover:bg-nature-500 text-white'
                }`}
              >
                {contract?.status === 'active' ? 'Contract Active ✓' : hasUserConfirmed ? 'Waiting for Other Party...' : 'Establish Contract'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function SigBox({ label, sublabel, sigUrl, canUpload, uploading, onUpload, isConfirmed }) {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${sigUrl ? 'border-nature-500/30 bg-nature-500/5' : 'border-industrial-800 bg-industrial-950/50'}`}>
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-sm">{label}</h4>
            {isConfirmed && (
              <span className="text-[10px] bg-nature-500/20 text-nature-400 px-1.5 py-0.5 rounded border border-nature-500/30 font-bold uppercase">
                Confirmed
              </span>
            )}
          </div>
          <p className="text-xs text-industrial-400 mt-0.5">{sublabel}</p>
        </div>
        {sigUrl ? (
          <CheckCircle className="text-nature-500 shrink-0" size={18} />
        ) : (
          canUpload && (
            <label className={`cursor-pointer bg-industrial-800 hover:bg-industrial-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <Upload size={13} /> {uploading ? 'Uploading...' : 'Upload Signature'}
              <input type="file" className="hidden" accept="image/*" onChange={onUpload} disabled={uploading} />
            </label>
          )
        )}
      </div>
      <div className="h-24 bg-industrial-900/50 rounded-xl border-2 border-dashed border-industrial-800 flex items-center justify-center overflow-hidden">
        {sigUrl ? (
          <img src={sigUrl} alt={label} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-center p-3">
            <FileSignature className="text-industrial-700 mx-auto mb-1.5" size={26} />
            <p className="text-xs text-industrial-500">Awaiting signature</p>
          </div>
        )}
      </div>
    </div>
  );
}
