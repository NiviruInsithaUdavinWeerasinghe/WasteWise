import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserCheck, FileSignature, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProposeContractModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: recipient, 2: terms
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    wasteType: '',
    monthlyQuantityKg: '',
    pricePerKg: '',
    durationMonths: '',
    customTerms: ''
  });
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedRecipient(null);
      setForm({ wasteType: '', monthlyQuantityKg: '', pricePerKg: '', durationMonths: '', customTerms: '' });
    }
  }, [isOpen]);

  const handleSearch = (val) => {
    setSearchQuery(val);
    clearTimeout(searchTimeout.current);
    if (val.length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`http://localhost:5000/api/auth/search?email=${encodeURIComponent(val)}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) setSearchResults(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSubmit = async () => {
    if (!selectedRecipient || !form.wasteType || !form.monthlyQuantityKg || !form.pricePerKg || !form.durationMonths) {
      alert('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/contracts/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({
          receiverId: selectedRecipient._id,
          wasteType: form.wasteType,
          monthlyQuantityKg: Number(form.monthlyQuantityKg),
          pricePerKg: Number(form.pricePerKg),
          durationMonths: Number(form.durationMonths),
          customTerms: form.customTerms
        })
      });
      if (res.ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to propose contract');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-industrial-950/90 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-50 bg-industrial-900 rounded-3xl shadow-2xl w-full max-w-lg border border-industrial-800 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-industrial-800 flex justify-between items-center bg-industrial-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-nature-500/10 rounded-xl text-nature-500 border border-nature-500/20">
                  <FileSignature size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Propose Long-Term Contract</h2>
                  <p className="text-xs text-industrial-400">
                    {step === 1 ? 'Step 1: Find the other party' : `Step 2: Set supply terms for ${selectedRecipient?.name}`}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-industrial-800 rounded-full text-industrial-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex px-6 pt-4 gap-2">
              {[1, 2].map(s => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? 'bg-nature-500' : 'bg-industrial-800'}`} />
              ))}
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-industrial-400 uppercase mb-2">Search Counterparty by Email</label>
                      <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-industrial-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          autoFocus
                          onChange={e => handleSearch(e.target.value)}
                          placeholder="e.g. buyer@company.com"
                          className="w-full bg-industrial-800 border border-industrial-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-industrial-500 focus:outline-none focus:border-nature-500/50 transition-colors text-sm"
                        />
                        {searching && <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-industrial-400 animate-spin" />}
                      </div>
                    </div>

                    {/* Results */}
                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {searchResults.map(u => (
                          <button
                            key={u._id}
                            onClick={() => setSelectedRecipient(u)}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                              selectedRecipient?._id === u._id
                                ? 'border-nature-500/50 bg-nature-500/10'
                                : 'border-industrial-800 bg-industrial-950/50 hover:border-industrial-700'
                            }`}
                          >
                            <div className="w-9 h-9 rounded-full bg-industrial-800 flex items-center justify-center text-white font-bold text-sm shrink-0 border border-industrial-700">
                              {u.name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white text-sm truncate">{u.name}</p>
                              <p className="text-xs text-industrial-400 truncate">{u.email} &bull; {u.role}</p>
                            </div>
                            {selectedRecipient?._id === u._id && <UserCheck size={18} className="text-nature-500 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                      <p className="text-center text-xs text-industrial-500 py-4">No users found. Try a different email.</p>
                    )}

                    {selectedRecipient && (
                      <div className="p-3.5 rounded-xl bg-nature-500/5 border border-nature-500/20 flex items-center gap-3">
                        <UserCheck size={18} className="text-nature-500 shrink-0" />
                        <p className="text-sm text-white font-medium">Selected: <span className="text-nature-400">{selectedRecipient.name}</span></p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-industrial-400 uppercase mb-2">Material / Waste Type *</label>
                      <input
                        type="text"
                        value={form.wasteType}
                        autoFocus
                        onChange={e => setForm({ ...form, wasteType: e.target.value })}
                        placeholder="e.g. Polyester Fabric Offcuts"
                        className="w-full bg-industrial-800 border border-industrial-700 rounded-xl px-4 py-3 text-white placeholder-industrial-500 focus:outline-none focus:border-nature-500/50 transition-colors text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-industrial-400 uppercase mb-2">Monthly Qty (KG) *</label>
                        <input
                          type="number" min="0"
                          value={form.monthlyQuantityKg}
                          onChange={e => setForm({ ...form, monthlyQuantityKg: e.target.value })}
                          placeholder="500"
                          className="w-full bg-industrial-800 border border-industrial-700 rounded-xl px-4 py-3 text-white placeholder-industrial-500 focus:outline-none focus:border-nature-500/50 transition-colors text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-industrial-400 uppercase mb-2">Price (LKR/KG) *</label>
                        <input
                          type="number" min="0"
                          value={form.pricePerKg}
                          onChange={e => setForm({ ...form, pricePerKg: e.target.value })}
                          placeholder="150"
                          className="w-full bg-industrial-800 border border-industrial-700 rounded-xl px-4 py-3 text-white placeholder-industrial-500 focus:outline-none focus:border-nature-500/50 transition-colors text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-industrial-400 uppercase mb-2">Duration (Months) *</label>
                        <input
                          type="number" min="1" max="60"
                          value={form.durationMonths}
                          onChange={e => setForm({ ...form, durationMonths: e.target.value })}
                          placeholder="12"
                          className="w-full bg-industrial-800 border border-industrial-700 rounded-xl px-4 py-3 text-white placeholder-industrial-500 focus:outline-none focus:border-nature-500/50 transition-colors text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-industrial-400 uppercase mb-2">Custom Terms <span className="normal-case text-industrial-500 font-normal">(optional)</span></label>
                      <textarea
                        rows="3"
                        value={form.customTerms}
                        onChange={e => setForm({ ...form, customTerms: e.target.value })}
                        placeholder="e.g. Delivery on 1st of each month. Quality inspected prior to dispatch."
                        className="w-full bg-industrial-800 border border-industrial-700 rounded-xl px-4 py-3 text-white placeholder-industrial-500 focus:outline-none focus:border-nature-500/50 transition-colors text-sm resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-industrial-800 flex gap-3 bg-industrial-950/30">
              {step === 2 && (
                <button onClick={() => setStep(1)} className="px-5 py-3 bg-industrial-800 hover:bg-industrial-700 text-white font-bold rounded-xl transition-colors text-sm">
                  Back
                </button>
              )}
              {step === 1 ? (
                <button
                  disabled={!selectedRecipient}
                  onClick={() => setStep(2)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold rounded-xl transition-all text-sm ${
                    selectedRecipient ? 'bg-nature-600 hover:bg-nature-500 text-white shadow-lg active:scale-95' : 'bg-industrial-800 text-industrial-500 cursor-not-allowed'
                  }`}
                >
                  Next: Set Terms <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-nature-600 hover:bg-nature-500 text-white font-bold rounded-xl transition-all text-sm shadow-lg active:scale-95 disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <FileSignature size={16} />}
                  {submitting ? 'Sending...' : 'Send Contract Proposal'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
