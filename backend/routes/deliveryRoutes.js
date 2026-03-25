const express = require('express');
const router = express.Router();
const Agreement = require('../models/Agreement');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Apply protection to all delivery routes
router.use(protect);

// @desc    Get all available platform logistics jobs
// @route   GET /api/delivery/available
// @access  Private (Deliveryman)
router.get('/available', async (req, res) => {
    try {
        const jobs = await Agreement.find({
            pickupResponsibility: 'Platform Logistics',
            deliveryStatus: 'pending'
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
router.post('/:id/assign', async (req, res) => {
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

        deliveryman.currentDeliveryId = agreementId;
        await deliveryman.save();

        res.status(200).json({ message: 'Job assigned successfully', agreement });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error assigning job' });
    }
});

// @desc    Scan QR and mark as delivered
// @route   POST /api/delivery/scan
// @access  Private (Deliveryman)
router.post('/scan', async (req, res) => {
    try {
        const { qrCodeString } = req.body;
        const deliverymanId = req.user.id;

        const agreement = await Agreement.findOne({ qrCodeString, deliverymanId: deliverymanId });

        if (!agreement) {
            return res.status(404).json({ message: 'Invalid QR code or you are not assigned to this delivery' });
        }

        if (agreement.deliveryStatus === 'delivered') {
            return res.status(400).json({ message: 'This delivery is already completed' });
        }

        agreement.deliveryStatus = 'delivered';
        await agreement.save();

        const deliveryman = await User.findById(deliverymanId);
        deliveryman.currentDeliveryId = null;
        await deliveryman.save();

        res.status(200).json({ message: 'Delivery completed successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during QR scan' });
    }
});

module.exports = router;
