import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck,
    Package,
    MapPin,
    CheckCircle,
    QrCode,
    Upload,
    Loader2,
    AlertCircle,
    Navigation,
    ExternalLink,
    ChevronRight
} from 'lucide-react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

export default function DeliveryDashboard() {
    const { user } = useAuth();
    const [availableJobs, setAvailableJobs] = useState([]);
    const [activeDelivery, setActiveDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [scannerResult, setScannerResult] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/delivery/available', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAvailableJobs(data);

                // Check if I have an active delivery
                const active = data.find(job => job.deliverymanId === user.id && job.deliveryStatus === 'in_transit');
                if (active) setActiveDelivery(active);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch jobs');
        } finally {
            setLoading(false);
        }
    };

    const claimJob = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/delivery/${id}/assign`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                fetchJobs();
                setActiveDelivery(data.agreement);
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Error claiming job');
        }
    };

    const handleScanSuccess = async (decodedText) => {
        setScanning(false);
        try {
            const response = await fetch('http://localhost:5000/api/delivery/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ qrCodeString: decodedText })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Delivery confirmed! High five!');
                setActiveDelivery(null);
                fetchJobs();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Scanning error');
        }
    };

    const startScanner = () => {
        setScanning(true);
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
                supportedScanTypes: [0, 1] // Camera and File
            });
            scanner.render(handleScanSuccess, (err) => console.warn(err));
        }, 100);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={40} className="text-nature-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-industrial-900 p-6 rounded-3xl border border-industrial-800 shadow-xl">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Truck className="text-nature-500" size={32} /> Logistics Hub
                    </h1>
                    <p className="text-industrial-400 font-medium">Earn by delivering industrial waste efficiently.</p>
                </div>
                <div className="bg-nature-500/10 px-4 py-2 rounded-2xl border border-nature-500/20">
                    <span className="text-nature-500 font-bold text-sm">Status: Active Courier</span>
                </div>
            </header>

            {/* Active Delivery Card */}
            <AnimatePresence>
                {activeDelivery && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gradient-to-br from-nature-600 to-nature-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Navigation size={120} />
                        </div>
                        <div className="relative z-10">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Active Assignment</span>
                            <h2 className="text-2xl font-black mb-6">{activeDelivery.listingId.wasteType} Delivery</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="flex items-start gap-3">
                                    <MapPin className="shrink-0 mt-1" size={20} />
                                    <div>
                                        <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Pickup</p>
                                        <p className="font-bold">{activeDelivery.sellerId.name}</p>
                                        <p className="text-sm opacity-80">{activeDelivery.listingId.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Navigation className="shrink-0 mt-1" size={20} />
                                    <div>
                                        <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Destination</p>
                                        <p className="font-bold">{activeDelivery.buyerId.name}</p>
                                        <p className="text-sm opacity-80">{activeDelivery.buyerId.companyDetails?.address || 'Buyer Registered Address'}</p>
                                    </div>
                                </div>
                            </div>

                            {!scanning ? (
                                <button
                                    onClick={startScanner}
                                    className="w-full bg-white text-nature-700 font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-industrial-50 transition-all shadow-xl text-lg group"
                                >
                                    <QrCode size={24} className="group-hover:scale-110 transition-transform" />
                                    Scan to Confirm Delivery
                                </button>
                            ) : (
                                <div className="bg-white rounded-3xl p-4 sm:p-6 overflow-hidden">
                                    <div id="reader" className="w-full rounded-2xl overflow-hidden border-4 border-nature-100"></div>
                                    <button
                                        onClick={() => setScanning(false)}
                                        className="w-full mt-4 text-nature-600 font-bold py-2 hover:bg-nature-50 rounded-xl transition-colors"
                                    >
                                        Cancel Scanner
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Available Jobs List */}
            <section className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {availableJobs.length > 0 ? (
                        <>Available Jobs <span className="text-xs bg-industrial-800 text-industrial-400 px-2 py-1 rounded-lg">{availableJobs.length}</span></>
                    ) : 'Looking for available jobs...'}
                </h3>

                {availableJobs.length === 0 ? (
                    <div className="bg-industrial-900 border border-industrial-800 rounded-3xl p-12 text-center">
                        <div className="bg-industrial-950 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-industrial-800 shadow-inner">
                            <Package className="text-industrial-600" size={32} />
                        </div>
                        <h4 className="text-white font-bold mb-2">No jobs available right now</h4>
                        <p className="text-industrial-500 text-sm max-w-xs mx-auto">Check back in a few minutes or wait for fresh listings to be sold with platform logistics.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {availableJobs.filter(j => j._id !== activeDelivery?._id).map((job) => (
                            <motion.div
                                key={job._id}
                                whileHover={{ y: -4 }}
                                className="bg-industrial-900 border border-industrial-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-nature-500/30 transition-all group"
                            >
                                <div className="flex items-center gap-5 w-full">
                                    <div className="w-16 h-16 bg-industrial-950 rounded-2xl flex items-center justify-center border border-industrial-800 group-hover:border-nature-500/20 transition-colors shrink-0 overflow-hidden">
                                        <Package className="text-industrial-400" size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-white font-bold truncate flex items-center gap-2">
                                            {job.listingId.wasteType}
                                            <span className="text-[10px] bg-industrial-800 text-industrial-500 px-2 py-0.5 rounded-md font-black">{job.listingId.weight}KG</span>
                                        </h4>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs text-industrial-400 flex items-center gap-1.5"><MapPin size={12} className="text-nature-500" /> {job.listingId.location}</p>
                                            <p className="text-xs text-industrial-400 flex items-center gap-1.5 font-bold text-white/80"><ChevronRight size={12} className="text-nature-500" /> To: {job.buyerId.name}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
                                    <p className="text-lg font-black text-nature-500">LKR {job.deliveryFee?.toLocaleString()}</p>
                                    <button
                                        disabled={!!activeDelivery}
                                        onClick={() => claimJob(job._id)}
                                        className="w-full sm:w-auto bg-industrial-800 hover:bg-nature-600 text-white font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group-hover:bg-nature-600 shadow-lg"
                                    >
                                        Claim Job
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-industrial-900/50 p-6 rounded-3xl border border-industrial-800 hover:bg-industrial-900 transition-colors cursor-help">
                    <h5 className="text-white font-bold mb-3 flex items-center gap-2"><Navigation size={18} className="text-nature-500" /> How it works</h5>
                    <p className="text-xs text-industrial-400 leading-relaxed">Claim jobs from the available pool. Pick up the waste from the seller location and deliver it to the buyer. Scan the buyer's QR code on arrival to confirm delivery and get paid instantly.</p>
                </div>
                <div className="bg-industrial-900/50 p-6 rounded-3xl border border-industrial-800 hover:bg-industrial-900 transition-colors cursor-help">
                    <h5 className="text-white font-bold mb-3 flex items-center gap-2"><ExternalLink size={18} className="text-blue-500" /> Delivery Guidelines</h5>
                    <p className="text-xs text-industrial-400 leading-relaxed">Ensure you have the proper vehicle capacity for the weight listed. Maintain waste segregation standards during transport for premium recycling points.</p>
                </div>
            </div>
        </div>
    );
}
