import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Package, MapPin, Scale, Tag, Info, AlertTriangle, QrCode, Loader2, Truck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function DeliveryDetailsModal({ isOpen, onClose, delivery, onConfirmReceipt }) {
  const { user } = useAuth();
  const [confirmStage, setConfirmStage] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCourierPopup, setShowCourierPopup] = useState(false);

  React.useEffect(() => {
    let interval;
    if (isOpen && delivery?.id) {
      fetchDeliveryStatus();
      
      // Poll every 5 seconds while modal is open and delivery is not yet fully completed/delivered
      interval = setInterval(() => {
        if (deliveryInfo?.deliveryStatus !== 'delivered' && deliveryInfo?.deliveryStatus !== 'qr_scanned') {
          fetchDeliveryStatus();
        }
      }, 5000);
    } else {
      setDeliveryInfo(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, delivery?.id, deliveryInfo?.deliveryStatus]);

  const fetchDeliveryStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/listings/${delivery.id}/delivery-status`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDeliveryInfo(data);
      }
    } catch (err) {
      console.error("Error fetching delivery status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmStage(false);
    onClose();
  };

  const handleConfirmClick = () => {
    if (!confirmStage) {
      setConfirmStage(true);
    } else {
      onConfirmReceipt(delivery.id);
      setConfirmStage(false);
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && delivery && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-industrial-950/90 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-50 w-full max-w-2xl bg-industrial-900 border border-industrial-800 rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh]"
          >
            {/* Header Image */}
            <div className="relative h-48 sm:h-64 overflow-hidden">
              <img
                src={delivery.image}
                alt={delivery.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-industrial-900 via-transparent to-transparent" />
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-4 left-6">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border mb-2 inline-block ${
                  deliveryInfo?.deliveryStatus === 'qr_scanned' 
                    ? 'text-nature-400 bg-nature-500/10 border-nature-500/20' 
                    : deliveryInfo?.deliveryman 
                      ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
                      : 'text-industrial-400 bg-industrial-500/10 border-industrial-500/20'
                }`}>
                  {deliveryInfo?.deliveryStatus === 'qr_scanned' ? 'Ready for Handover' : deliveryInfo?.deliveryman ? 'In Transit' : 'Awaiting Courier'}
                </span>
                <h2 className="text-2xl font-bold text-white">{delivery.title}</h2>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-industrial-400">
                    <Package size={18} className="text-nature-500" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-industrial-500">Material Type</p>
                      <p className="text-white font-medium">{delivery.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-industrial-400">
                    <Scale size={18} className="text-blue-500" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-industrial-500">Weight</p>
                      <p className="text-white font-medium">{delivery.weight}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-industrial-400">
                    <MapPin size={18} className="text-red-500" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-industrial-500">Source Location</p>
                      <p className="text-white font-medium">{delivery.location}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-industrial-400">
                    <Tag size={18} className="text-yellow-500" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-industrial-500">Condition</p>
                      <p className="text-white font-medium">{delivery.condition}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-industrial-400">
                    <Info size={18} className="text-purple-500" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-industrial-500">Seller</p>
                      <p className="text-white font-medium">{delivery.sellerName}</p>
                    </div>
                  </div>
                  
                  {deliveryInfo?.deliveryman && (
                    <div className="relative">
                      <button 
                        onClick={() => setShowCourierPopup(!showCourierPopup)}
                        className="w-full flex items-center gap-3 pt-4 border-t border-industrial-800 hover:bg-white/5 p-2 rounded-lg transition-colors group text-left"
                      >
                        {deliveryInfo.deliveryman.profilePhoto ? (
                          <img src={deliveryInfo.deliveryman.profilePhoto} className="w-8 h-8 rounded-full border border-nature-500/30 object-cover" alt="Courier" />
                        ) : (
                          <div className="w-8 h-8 bg-nature-500/10 rounded-full flex items-center justify-center border border-nature-500/30">
                            <Truck size={14} className="text-nature-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-nature-500 group-hover:text-nature-400 transition-colors">Assigned Courier</p>
                          <p className="text-white text-sm font-bold flex items-center gap-2">
                            {deliveryInfo.deliveryman.name}
                            <Info size={12} className="opacity-50" />
                          </p>
                        </div>
                      </button>

                      {/* Courier Contact Popup */}
                      <AnimatePresence>
                        {showCourierPopup && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-2 w-64 bg-industrial-900 border border-industrial-700 rounded-xl shadow-2xl p-4 z-[60]"
                          >
                            <div className="flex items-center gap-3 mb-4">
                                {deliveryInfo.deliveryman.profilePhoto ? (
                                    <img src={deliveryInfo.deliveryman.profilePhoto} className="w-12 h-12 rounded-full border-2 border-nature-500/30 object-cover" alt="Courier" />
                                ) : (
                                    <div className="w-12 h-12 bg-nature-500/10 rounded-full flex items-center justify-center border-2 border-nature-500/30">
                                        <Truck size={20} className="text-nature-500" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-white font-bold">{deliveryInfo.deliveryman.name}</p>
                                    <p className="text-[10px] text-nature-500 font-bold uppercase">Sustainability Partner</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <a href={`mailto:${deliveryInfo.deliveryman.email}`} className="flex items-center gap-2 text-xs text-industrial-300 hover:text-white transition-colors bg-industrial-950/50 p-2 rounded-lg border border-industrial-800">
                                    <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Info size={10} className="text-blue-500" />
                                    </div>
                                    <span className="truncate">{deliveryInfo.deliveryman.email}</span>
                                </a>
                                {deliveryInfo.deliveryman.phoneNumber && (
                                    <a href={`tel:${deliveryInfo.deliveryman.phoneNumber}`} className="flex items-center gap-2 text-xs text-industrial-300 hover:text-white transition-colors bg-industrial-950/50 p-2 rounded-lg border border-industrial-800">
                                        <div className="w-6 h-6 rounded-md bg-nature-500/10 flex items-center justify-center border border-nature-500/20">
                                            <Info size={10} className="text-nature-500" />
                                        </div>
                                        <span>{deliveryInfo.deliveryman.phoneNumber}</span>
                                    </a>
                                )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {delivery.description && (
                <div className="mb-8 p-4 bg-industrial-950/50 rounded-xl border border-industrial-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-industrial-500 mb-2">Description</p>
                  <p className="text-sm text-industrial-300 leading-relaxed italic">
                    "{delivery.description}"
                  </p>
                </div>
              )}
              {(deliveryInfo?.deliveryStatus === 'in_transit' || deliveryInfo?.deliveryStatus === 'pending') && deliveryInfo?.qrCodeString && (
                <div className="mb-8 p-6 bg-nature-950/20 border border-nature-500/20 rounded-2xl flex flex-col items-center">
                  <div className="flex items-center gap-2 text-nature-400 font-bold mb-4">
                    <QrCode size={18} />
                    <span className="text-sm tracking-wide uppercase">Courier Verification QR</span>
                  </div>
                  <div className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <QRCodeSVG
                      value={deliveryInfo.qrCodeString}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="mt-4 text-center text-[10px] text-industrial-400 font-medium">
                    Show this code to the deliveryman upon arrival to confirm receipt.
                  </p>
                  
                  {deliveryInfo?.deliveryStatus === 'qr_scanned' ? (
                    <div className="mt-4 px-4 py-2 bg-nature-500/10 border border-nature-500/30 rounded-full flex items-center gap-2">
                       <CheckCircle size={14} className="text-nature-500" />
                       <span className="text-[10px] font-bold text-nature-400 uppercase tracking-wider">QR Scanned ✓ — You can now confirm receipt</span>
                    </div>
                  ) : (
                    <div className="mt-4 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center gap-2 animate-pulse">
                       <Loader2 size={12} className="text-blue-500 animate-spin" />
                       <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Waiting for deliveryman to scan QR...</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border border-industrial-800 text-industrial-300 font-bold rounded-xl hover:bg-industrial-800 transition-colors"
                >
                  Close
                </button>

                <motion.button
                  onClick={handleConfirmClick}
                  disabled={deliveryInfo?.deliveryStatus !== 'qr_scanned' && delivery.pickupResponsibility === 'Platform Logistics'}
                  layout
                  animate={{
                    backgroundColor: confirmStage ? '#16a34a' : '#2563eb',
                    opacity: (deliveryInfo?.deliveryStatus !== 'qr_scanned' && delivery.pickupResponsibility === 'Platform Logistics') ? 0.5 : 1
                  }}
                  transition={{ duration: 0.2 }}
                  className="flex-[2] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:cursor-not-allowed"
                  style={{
                    boxShadow: confirmStage
                      ? '0 4px 24px rgba(22,163,74,0.35)'
                      : '0 4px 24px rgba(37,99,235,0.25)',
                  }}
                >
                  {confirmStage ? (
                    <>
                      <AlertTriangle size={20} className="shrink-0" />
                      Are you sure?
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} className="shrink-0" />
                      {deliveryInfo?.deliveryStatus !== 'qr_scanned' && delivery.pickupResponsibility === 'Platform Logistics' 
                        ? 'Waiting for Scan' 
                        : 'Confirm Receipt'}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
