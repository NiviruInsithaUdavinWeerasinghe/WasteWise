import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Loader2,
    DollarSign,
    Award,
    Clock,
    History,
    AlertCircle,
    Navigation,
    ExternalLink,
    ChevronRight,
    Truck,
    Package,
    MapPin,
    CheckCircle,
    QrCode,
    Upload,
    Leaf
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { API_BASE_URL } from '../config/api';

export default function DeliveryDashboard() {
    const { user } = useAuth();
    const [availableJobs, setAvailableJobs] = useState([]);
    const [activeDelivery, setActiveDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [scannerResult, setScannerResult] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [error, setError] = useState('');
    const [stats, setStats] = useState({ totalEarnings: 0, totalDeliveries: 0, activeCount: 0, totalWeight: 0 });
    const [history, setHistory] = useState([]);
    const [confirmingJobId, setConfirmingJobId] = useState(null);

    useEffect(() => {
        if (confirmingJobId) {
            const timer = setTimeout(() => setConfirmingJobId(null), 3500);
            return () => clearTimeout(timer);
        }
    }, [confirmingJobId]);

    useEffect(() => {
        if (user?.id) {
            fetchJobs();
            fetchStats();
            fetchHistory();
        }
        if (message.text) {
            const timer = setTimeout(() => setMessage({ text: '', type: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [user, message.text]);

    useEffect(() => {
        return () => {
            if (window.scannerInstance) {
                window.scannerInstance.stop().catch(console.error);
            }
        };
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/delivery/available`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAvailableJobs(data);

                // Check if I have an active delivery (either in transit or just scanned by me)
                const active = data.find(job => {
                    const jobDeliverymanId = job.deliverymanId?._id || job.deliverymanId;
                    return jobDeliverymanId === user.id && 
                           (job.deliveryStatus === 'in_transit' || job.deliveryStatus === 'qr_scanned');
                });
                setActiveDelivery(active || null);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to fetch jobs');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/delivery/stats`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) setStats(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/delivery/history`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) setHistory(await res.json());
        } catch (err) { console.error(err); }
    };

    const claimJob = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/delivery/${id}/assign`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: 'Job claimed successfully! Get moving.' });
                fetchJobs();
                setActiveDelivery(data.agreement);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to claim job' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error claiming job' });
        }
    };

    const handleScanSuccess = async (decodedText) => {
        if (window.scannerInstance) {
            await stopScanner();
        }
        setScanning(false);
        try {
            const response = await fetch(`${API_BASE_URL}/delivery/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`
                },
                body: JSON.stringify({ qrCodeString: decodedText })
            });
            const data = await response.json();
            if (response.ok) {
                setMessage({ type: 'success', text: 'Handshake Verified! Waiting for buyer to finalize.' });
                fetchJobs(); 
            } else {
                // Better error visibility for the "404" business logic error
                setMessage({ 
                    type: 'error', 
                    text: data.message || (response.status === 404 ? 'Invalid QR code or assignment mismatch.' : 'Scanning failed.') 
                });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error. Please ensure you are online.' });
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const html5QrCode = new Html5Qrcode("reader-hidden");
        try {
            const decodedText = await html5QrCode.scanFile(file, true);
            handleScanSuccess(decodedText);
        } catch (err) {
            setMessage({ type: 'error', text: "No QR code found in this image. Please try another one." });
            console.error(err);
        }
    };

    const startScanner = () => {
        setScanning(true);
        setTimeout(() => {
            const html5QrCode = new Html5Qrcode("reader");
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            
            html5QrCode.start(
                { facingMode: "environment" }, 
                config, 
                handleScanSuccess
            ).catch(err => {
                console.error("Scanner start error:", err);
                const isPermissionError = err?.toString().includes("NotAllowedError") || err?.toString().includes("Permission dismissed");
                setError(isPermissionError ? "Camera Access Denied. Please enable it in your browser settings." : "Could not start camera.");
                setScanning(false);
            });

            // Store instance for cleanup
            window.scannerInstance = html5QrCode;
        }, 300);
    };

    const stopScanner = async () => {
        if (window.scannerInstance) {
            try {
                await window.scannerInstance.stop();
                delete window.scannerInstance;
            } catch (err) {
                console.error("Scanner stop error:", err);
            }
        }
        setScanning(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 size={40} className="text-nature-500 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 relative">
            {/* Global Notification */}
            <AnimatePresence>
                {message.text && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className={`fixed top-6 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
                            message.type === 'success' 
                                ? 'bg-nature-500/20 border-nature-500/30 text-nature-100' 
                                : 'bg-red-500/20 border-red-500/30 text-red-100'
                        }`}
                    >
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span className="font-bold text-sm tracking-tight">{message.text}</span>
                        <button onClick={() => setMessage({ text: '', type: '' })} className="ml-4 opacity-50 hover:opacity-100">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-industrial-900 p-6 rounded-3xl border border-industrial-800 shadow-xl">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Truck className="text-nature-500" size={32} /> Logistics Hub
                    </h1>
                    <p className="text-industrial-400 font-medium">Earn by delivering industrial waste efficiently.</p>
                </div>
                <div className={`px-4 py-2 rounded-2xl border ${!user?.isApproved ? 'bg-orange-500/10 border-orange-500/20' : 'bg-nature-500/10 border-nature-500/20'}`}>
                    <span className={`${!user?.isApproved ? 'text-orange-500' : 'text-nature-500'} font-bold text-sm`}>
                        Status: {user?.isApproved ? 'Active Courier' : 'Pending Verification'}
                    </span>
                </div>
            </header>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    index={0}
                    icon={DollarSign}
                    label="Total Earnings"
                    value={`Rs ${stats.totalEarnings?.toLocaleString()}`}
                    subValue="Paid via Secure Escrow"
                    color="nature"
                />

                <StatCard 
                    index={1}
                    icon={Award}
                    label="Deliveries"
                    value={stats.totalDeliveries}
                    subValue="100% Success Rate"
                    color="blue"
                />

                <StatCard 
                    index={2}
                    icon={Clock}
                    label="Active Assignment"
                    value={stats.activeCount}
                    subValue="Real-time Tracking"
                    color="orange"
                />

                <StatCard 
                    index={3}
                    icon={Leaf}
                    label="Weight Delivered"
                    value={`${stats.totalWeight?.toLocaleString()} KG`}
                    subValue="Industrial Waste Diverted"
                    color="purple"
                />
            </div>

            {!user?.isApproved && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-500/10 border border-orange-500/50 rounded-3xl p-6 flex items-start gap-4 shadow-lg"
                >
                    <AlertCircle className="text-orange-500 shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="text-orange-600 font-bold text-lg mb-1">Account pending admin approval</h3>
                        <p className="text-orange-700/80 text-sm">Your courier account is currently under review. You can browse available logistics jobs, but you will not be able to claim any deliveries until an administrator verifies your contact details and address.</p>
                    </div>
                </motion.div>
            )}

            {/* Active Delivery Card */}
            <AnimatePresence>
                {activeDelivery && (
                    <motion.div
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         className="bg-gradient-to-br from-nature-600 to-nature-700 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
                     >
                         <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Navigation size={120} />
                        </div>
                        <div className="relative z-10">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block">Active Assignment</span>
                            <h2 className="text-xl font-black mb-4">{activeDelivery.listingId.wasteType} Delivery</h2>

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
                                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Destination</p>
                                        <p className="font-bold text-sm">{activeDelivery.buyerId.name}</p>
                                        <p className="text-xs opacity-80 truncate max-w-[200px]">{activeDelivery.buyerId.companyDetails?.address || 'Buyer Registered Address'}</p>
                                    </div>
                                </div>
                            </div>

                            {activeDelivery.deliveryStatus === 'qr_scanned' ? (
                                <div className="w-full bg-white/20 border border-white/30 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl text-lg">
                                    <CheckCircle size={24} />
                                    QR Scanned - Waiting for Buyer
                                </div>
                            ) : !scanning ? (
                                <>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={startScanner}
                                            className="flex-1 bg-white text-nature-700 font-black py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-industrial-50 transition-all shadow-xl group"
                                        >
                                            <QrCode size={20} className="group-hover:scale-110 transition-transform" />
                                            Scan QR
                                        </button>
                                        <label className="flex-1 bg-nature-800/30 border border-white/20 text-white font-black py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all cursor-pointer group">
                                            <Upload size={20} className="group-hover:scale-110 transition-transform" />
                                            Upload Image
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    </div>
                                    <div id="reader-hidden" className="hidden"></div>
                                </>
                            ) : (
                                <div className="bg-white rounded-3xl p-4 sm:p-6 overflow-hidden">
                                    <div id="reader" className="w-full aspect-square max-w-[400px] mx-auto rounded-2xl overflow-hidden"></div>
                                    <button
                                        onClick={stopScanner}
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
                                whileHover={{ y: -2 }}
                                className="bg-industrial-900 border border-industrial-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-nature-500/30 transition-all group"
                            >
                                <div className="flex items-center gap-4 w-full">
                                    <div className="w-12 h-12 bg-industrial-950 rounded-xl flex items-center justify-center border border-industrial-800 group-hover:border-nature-500/20 transition-colors shrink-0 overflow-hidden">
                                        <Package className="text-industrial-400" size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-white font-bold text-sm truncate flex items-center gap-2">
                                            {job.listingId.wasteType}
                                            <span className="text-[10px] bg-industrial-800 text-industrial-500 px-2 py-0.5 rounded-md font-black">{job.listingId.weight}KG</span>
                                        </h4>
                                        <div className="mt-1 space-y-0.5">
                                            <p className="text-[11px] text-industrial-400 flex items-center gap-1.5"><MapPin size={10} className="text-nature-500" /> {job.listingId.location}</p>
                                            <p className="text-[11px] text-industrial-400 flex items-center gap-1.5 font-bold text-white/80"><ChevronRight size={10} className="text-nature-500" /> To: {job.buyerId.name}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-industrial-800/50 pt-3 sm:pt-0 mt-2 sm:mt-0">
                                    <div className="text-left sm:text-right">
                                        <p className="text-[10px] text-industrial-500 font-black uppercase tracking-[0.15em] mb-0.5 sm:mb-1">Delivery Fee</p>
                                        <p className="text-xl font-black text-nature-500 whitespace-nowrap leading-none">LKR {job.deliveryFee?.toLocaleString()}</p>
                                    </div>
                                    <button
                                        disabled={!!activeDelivery || !user?.isApproved}
                                        onClick={() => {
                                            if (confirmingJobId === job._id) {
                                                claimJob(job._id);
                                                setConfirmingJobId(null);
                                            } else {
                                                setConfirmingJobId(job._id);
                                            }
                                        }}
                                        className={`min-w-[140px] font-black text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl ${
                                            confirmingJobId === job._id 
                                                ? 'bg-blue-600 text-white animate-pulse scale-105 shadow-blue-500/20' 
                                                : 'bg-nature-500/10 border border-nature-500/20 text-nature-500 hover:bg-nature-500 hover:text-white group-hover:bg-nature-500 group-hover:text-white'
                                        }`}
                                    >
                                        {confirmingJobId === job._id ? 'Are you sure?' : 'Claim Job'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch pb-12">
                <div className="bg-industrial-900 p-6 rounded-3xl border border-industrial-800 shadow-xl space-y-4 h-[400px]">
                    <div className="flex items-center gap-3">
                        <div className="bg-nature-500/10 p-2 rounded-lg"><Navigation className="text-nature-500" size={20} /></div>
                        <h3 className="text-xl font-bold text-white tracking-tight">How it works</h3>
                    </div>
                    <div className="space-y-4 text-industrial-400 text-sm leading-relaxed overflow-y-auto pr-2 custom-scrollbar h-[260px]">
                        <p>1. <strong>Claim Assignments</strong>: Browse the available jobs and claim ones that fit your vehicle capacity and route.</p>
                        <p>2. <strong>Pick Up Waste</strong>: Navigate to the seller location (factory) and pick up the industrial waste listing.</p>
                        <p>3. <strong>Verify Delivery</strong>: Upon arrival at the buyer location, present your QR profile or scan the buyer's handshake code to confirm receipt.</p>
                        <p>4. <strong>Instant Payout</strong>: Once verified, the delivery fee is instantly credited to your platform wallet via our secure escrow system.</p>
                    </div>
                </div>

                <div className="bg-industrial-900 p-8 rounded-3xl border border-industrial-800 shadow-xl space-y-6 h-[400px] flex flex-col">
                    <div className="flex items-center gap-3">
                        <div className="bg-nature-500/10 p-2 rounded-lg"><History className="text-nature-500" size={20} /></div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Recent Activity</h3>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {history.length > 0 ? history.map((item) => (
                            <div key={item._id} className="flex items-center gap-4 p-3 bg-industrial-950/50 rounded-2xl border border-industrial-800/50 group hover:border-nature-500/30 transition-all">
                                <img src={item.listingId?.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-industrial-800 group-hover:border-nature-500/20" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{item.listingId?.wasteType}</p>
                                    <p className="text-[10px] text-industrial-500 uppercase font-black">To: {item.buyerId?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-nature-500">+LKR {item.deliveryFee?.toLocaleString()}</p>
                                    <p className="text-[10px] text-industrial-500 uppercase font-bold">Paid</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 opacity-40 h-full flex flex-col items-center justify-center">
                                <History size={48} className="mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest text-industrial-600 font-black">No history yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
