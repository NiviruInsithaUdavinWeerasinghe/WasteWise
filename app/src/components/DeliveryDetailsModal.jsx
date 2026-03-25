import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Package, MapPin, Scale, Tag, Info, AlertTriangle, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

export default function DeliveryDetailsModal({ isOpen, onClose, delivery, onConfirmReceipt }) {
  const { user } = useAuth();
  const [confirmStage, setConfirmStage] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && delivery?.id) {
      fetchDeliveryStatus();
    } else {
      setDeliveryInfo(null);
    }
  }, [isOpen, delivery?.id]);

  const fetchDeliveryStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/listings/${delivery.id}/delivery-status`, {
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
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mb-2 inline-block">
                  In Transit
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
              {deliveryInfo?.deliveryStatus === 'in_transit' && deliveryInfo?.qrCodeString && (
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
                  layout
                  animate={{
                    backgroundColor: confirmStage ? '#16a34a' : '#2563eb',
                  }}
                  transition={{ duration: 0.2 }}
                  className="flex-[2] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
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
                      Confirm Receipt
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
