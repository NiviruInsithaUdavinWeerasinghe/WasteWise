const express = require('express');
const router = express.Router();
const { 
  proposeContract, 
  getMyContracts, 
  editContract, 
  signContract, 
  confirmContract,
  downloadContract
} = require('../controllers/contractController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/contracts/propose
// @desc    Propose a long-term contract
// @access  Private
router.post('/propose', protect, proposeContract);

// @route   GET /api/contracts/my-contracts
// @desc    Get all contracts for the user
// @access  Private
router.get('/my-contracts', protect, getMyContracts);

// @route   PUT /api/contracts/:id/edit
// @desc    Edit contract terms
// @access  Private
router.put('/:id/edit', protect, editContract);

// @route   POST /api/contracts/:id/sign
// @desc    Sign contract
// @access  Private
router.post('/:id/sign', protect, signContract);

// @route   POST /api/contracts/:id/confirm
// @desc    Mutually confirm and establish contract
// @access  Private
router.post('/:id/confirm', protect, confirmContract);

// @route   GET /api/contracts/:id/download
// @desc    Download Contract PDF
// @access  Private
router.get('/:id/download', protect, downloadContract);

module.exports = router;
