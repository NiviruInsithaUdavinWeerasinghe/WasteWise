const express = require('express');
const router = express.Router();
const Agreement = require('../models/Agreement');
const User = require('../models/User');
const { protect, approved } = require('../middleware/authMiddleware');

// Apply protection to all delivery routes
router.use(protect);

// @desc    Get all available platform logistics jobs
// @route   GET /api/delivery/available
// @access  Private (Deliveryman)
router.get('/available', async (req, res) => {
    try {
        const jobs = await Agreement.find({
            pickupResponsibility: 'Platform Logistics',
            $or: [
                { deliveryStatus: 'pending' },
                { deliverymanId: req.user.id, deliveryStatus: { $in: ['in_transit', 'qr_scanned'] } }
            ]
        }).populate('buyerId', 'name companyDetails')
            .populate('sellerId', 'name companyDetails')
            .populate('listingId', 'wasteType weight location');

        res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching available jobs' });
    }
});

// @desc    Deliveryman self-assigns an order
// @route   POST /api/delivery/:id/assign
// @access  Private (Deliveryman)
router.post('/:id/assign', approved, async (req, res) => {
    try {
        const deliverymanId = req.user.id;
        const agreementId = req.params.id;

        const deliveryman = await User.findById(deliverymanId);
        if (deliveryman.currentDeliveryId) {
            return res.status(400).json({ message: 'You already have an active delivery. Complete it first!' });
        }

        const agreement = await Agreement.findById(agreementId);
        if (!agreement) {
            return res.status(404).json({ message: 'Agreement not found' });
        }

        if (agreement.deliveryStatus !== 'pending') {
            return res.status(400).json({ message: 'This job is already taken or completed' });
        }

        agreement.deliverymanId = deliverymanId;
        agreement.deliveryStatus = 'in_transit';
        await agreement.save();

        const populatedAgreement = await Agreement.findById(agreementId)
            .populate('buyerId', 'name companyDetails')
            .populate('sellerId', 'name companyDetails')
            .populate('listingId', 'wasteType weight location');

        deliveryman.currentDeliveryId = agreementId;
        await deliveryman.save();

        res.status(200).json({ message: 'Job assigned successfully', agreement: populatedAgreement });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error assigning job' });
    }
});

// @desc    Scan QR and mark as delivered
// @route   POST /api/delivery/scan
// @access  Private (Deliveryman)
router.post('/scan', approved, async (req, res) => {
    try {
        const { qrCodeString } = req.body;
        const deliverymanId = req.user.id;

        if (!qrCodeString) {
            return res.status(400).json({ message: 'No QR code provided' });
        }

        // Diagnostic Find: Search by QR first to see if it even exists
        const agreementByQR = await Agreement.findOne({ qrCodeString });
        
        if (!agreementByQR) {
             console.log(`Scan Failure: QR code [${qrCodeString.substring(0, 8)}...] not found in database.`);
             return res.status(404).json({ message: 'Invalid handshake code. Please ensure you are scanning the buyer\'s latest QR code.' });
        }

        // Now check if it's assigned to THIS deliveryman
        const actualDeliverymanId = agreementByQR.deliverymanId?._id?.toString() || agreementByQR.deliverymanId?.toString();
        if (actualDeliverymanId !== deliverymanId.toString()) {
            console.log(`Scan Failure: QR matches Agreement ${agreementByQR._id}, but it is assigned to deliveryman ${actualDeliverymanId}, not ${deliverymanId}`);
            return res.status(403).json({ message: 'This delivery is not assigned to you.' });
        }

        if (agreementByQR.deliveryStatus === 'delivered' || agreementByQR.deliveryStatus === 'qr_scanned') {
            return res.status(400).json({ message: 'This handshake has already been verified.' });
        }

        agreementByQR.deliveryStatus = 'qr_scanned';
        await agreementByQR.save();

        console.log(`Scan Success: Handshake verified for Agreement ${agreementByQR._id} by courier ${deliverymanId}`);
        res.status(200).json({ message: 'Handshake Verified! Waiting for buyer to finalize the transaction.' });
    } catch (error) {
        console.error('QR Scan Processing Error:', error);
        res.status(500).json({ message: 'Internal server error during handshake verification.' });
    }
});

// @desc    Get deliveryman stats
// @route   GET /api/delivery/stats
// @access  Private (Deliveryman)
router.get('/stats', async (req, res) => {
    try {
        const deliverymanId = req.user.id;
        const completedJobs = await Agreement.find({
            deliverymanId,
            deliveryStatus: 'delivered'
        }).populate('listingId', 'weight');

        const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.deliveryFee || 0), 0);
        const totalDeliveries = completedJobs.length;
        
        // Active jobs count
        const activeCount = await Agreement.countDocuments({
            deliverymanId,
            deliveryStatus: { $in: ['in_transit', 'qr_scanned'] }
        });

        const totalWeight = completedJobs.reduce((sum, job) => {
            return sum + (job.listingId?.weight || 0);
        }, 0);

        res.status(200).json({
            totalEarnings,
            totalDeliveries,
            activeCount,
            totalWeight
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching stats' });
    }
});

// @desc    Get deliveryman history
// @route   GET /api/delivery/history
// @access  Private (Deliveryman)
router.get('/history', async (req, res) => {
    try {
        const deliverymanId = req.user.id;
        const history = await Agreement.find({
            deliverymanId,
            deliveryStatus: 'delivered'
        }).populate('listingId', 'wasteType weight imageUrl')
          .populate('buyerId', 'name')
          .sort({ updatedAt: -1 })
          .limit(10);

        res.status(200).json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching history' });
    }
});

module.exports = router;
