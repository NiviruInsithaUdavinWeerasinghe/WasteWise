const LongTermContract = require('../models/LongTermContract');
const User = require('../models/User');
const { sendNotification } = require('./notificationController');
const PDFDocument = require('pdfkit');
const path = require('path');

// @desc    Propose a long-term contract
// @route   POST /api/contracts/propose
// @access  Private
const proposeContract = async (req, res) => {
  try {
    const { receiverId, wasteType, monthlyQuantityKg, pricePerKg, durationMonths, customTerms } = req.body;
    const proposerId = req.user.id;

    if (!receiverId || !wasteType || !monthlyQuantityKg || !pricePerKg || !durationMonths) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const contract = await LongTermContract.create({
      proposerId,
      receiverId,
      wasteType,
      monthlyQuantityKg,
      pricePerKg,
      durationMonths,
      customTerms,
      status: 'pending_signature'
    });

    // Notify receiver
    await sendNotification(
      receiverId,
      'contract_proposed',
      `A new long-term waste supply contract for ${wasteType} has been proposed to you.`,
      contract._id
    );

    res.status(201).json(contract);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error proposing contract' });
  }
};

// @desc    Get all contracts for the user
// @route   GET /api/contracts/my-contracts
// @access  Private
const getMyContracts = async (req, res) => {
  try {
    const userId = req.user.id;
    const contracts = await LongTermContract.find({
      $or: [{ proposerId: userId }, { receiverId: userId }]
    })
      .populate('proposerId', 'name email role')
      .populate('receiverId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json(contracts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching contracts' });
  }
};

// @desc    Edit contract terms
// @route   PUT /api/contracts/:id/edit
// @access  Private
const editContract = async (req, res) => {
  try {
    const { wasteType, monthlyQuantityKg, pricePerKg, durationMonths, customTerms } = req.body;
    const contract = await LongTermContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.status !== 'pending_signature' && contract.status !== 'draft') {
      return res.status(400).json({ message: 'Contract cannot be edited in its current status' });
    }

    // Authorization: Only proposer or receiver can edit
    if (contract.proposerId.toString() !== req.user.id && contract.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this contract' });
    }

    contract.wasteType = wasteType || contract.wasteType;
    contract.monthlyQuantityKg = monthlyQuantityKg || contract.monthlyQuantityKg;
    contract.pricePerKg = pricePerKg || contract.pricePerKg;
    contract.durationMonths = durationMonths || contract.durationMonths;
    contract.customTerms = customTerms || contract.customTerms;
    
    // Reset signatures and confirmations if terms change
    contract.buyerSignatureUrl = '';
    contract.sellerSignatureUrl = '';
    contract.proposerConfirmed = false;
    contract.receiverConfirmed = false;

    await contract.save();

    const otherPartyId = contract.proposerId.toString() === req.user.id ? contract.receiverId : contract.proposerId;
    await sendNotification(
      otherPartyId,
      'contract_proposed',
      `The terms for the long-term contract for ${contract.wasteType} have been updated.`,
      contract._id
    );

    res.status(200).json(contract);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error editing contract' });
  }
};

// @desc    Sign contract
// @route   POST /api/contracts/:id/sign
// @access  Private
const signContract = async (req, res) => {
  try {
    const { signatureUrl, role } = req.body; // role: 'buyer' or 'seller'
    const contract = await LongTermContract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (role === 'buyer') {
      contract.buyerSignatureUrl = signatureUrl;
    } else if (role === 'seller') {
      contract.sellerSignatureUrl = signatureUrl;
    } else {
      return res.status(400).json({ message: 'Invalid role specified for signature' });
    }

    await contract.save();

    const otherPartyId = contract.proposerId.toString() === req.user.id ? contract.receiverId : contract.proposerId;
    await sendNotification(
      otherPartyId,
      'contract_signed',
      `The other party has signed the long-term contract for ${contract.wasteType}.`,
      contract._id
    );

    res.status(200).json(contract);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error signing contract' });
  }
};

/**
 * PDF Generation Helper
 */
const drawLongTermContract = async (doc, data) => {
  const { contract, proposer, receiver } = data;
  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 45;

  // ─── Colors ──────────────────────────────────────────────────
  const NAVY_DARK = '#020617';  // slate-950
  const NAVY_MID = '#0f172a';   // slate-900
  const NATURE_500 = '#22c55e'; // nature green
  const SLATE_400 = '#94a3b8';  // text-slate-400
  const SLATE_200 = '#e2e8f0';  // text-slate-200
  const BORDER_COLOR = '#1e293b'; // slate-800

  // ─── Background ───────────────────────────────────────────────
  doc.rect(0, 0, PAGE_W, PAGE_H).fill('#ffffff'); // White paper base

  // ─── Page Decoration Helpers ──────────────────────────────────
  const drawPageBorder = () => {
    doc.save();
    doc.rect(20, 20, PAGE_W - 40, PAGE_H - 40)
       .lineWidth(0.5)
       .strokeColor(BORDER_COLOR)
       .stroke();
    doc.restore();
  };

  const drawFooter = () => {
    // Save previous cursor positions to not disturb text flow across pages
    const oldX = doc.x;
    const oldY = doc.y;

    doc.save();
    doc.rect(0, PAGE_H - 80, PAGE_W, 80).fill('#f8fafc');
    doc.fillColor(SLATE_400).fontSize(8).font('Helvetica')
      .text('This contract is a permanent digital record generated by the WasteWise Circular Economy Platform.', MARGIN, PAGE_H - 55, { align: 'center', width: PAGE_W - MARGIN * 2 });
    doc.fillColor(NATURE_500).fontSize(10).font('Helvetica-Bold')
      .text('WasteWise • Building a Greener Tomorrow', MARGIN, PAGE_H - 35, { align: 'center', width: PAGE_W - MARGIN * 2 });
    doc.restore();

    // Restore text position coordinates
    doc.x = oldX;
    doc.y = oldY;

    // Reset back to normal body font color and style so next line doesn't grab footer style
    doc.fillColor(NAVY_MID).fontSize(10).font('Helvetica');
  };

  // Initial decoration on first page
  drawFooter();
  drawPageBorder();

  // Set margins to avoid collision with footer/border/headers on all pages
  doc.page.margins.bottom = 100;
  doc.page.margins.top = 45;
  doc.page.margins.left = MARGIN;
  doc.page.margins.right = MARGIN;

  // Handle new pages (borders + footer)
  doc.on('pageAdded', () => {
    doc.save();
    doc.rect(0, 0, PAGE_W, PAGE_H).fill('#ffffff');
    doc.restore();
    
    // Draw footer first so the page border is drawn on top of its background
    drawFooter();
    drawPageBorder();
    
    // Ensure new page also has the same margins
    doc.page.margins.bottom = 100;
    doc.page.margins.top = 45;
    doc.page.margins.left = MARGIN;
    doc.page.margins.right = MARGIN;
    
    // Force text cursor to the top margin so it doesn't print on the top edge
    doc.x = MARGIN;
    doc.y = 45;
  });

  // ─── Header Section (Dark) ────────────────────────────────────
  // Drawn after border so it covers the top part of the border on page 1
  doc.rect(0, 0, PAGE_W, 160).fill(NAVY_DARK);
  
  // Decorative side bar
  doc.rect(0, 0, 8, 160).fill(NATURE_500);

  // Logo Placeholder / Brand
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
    .text('WasteWise', MARGIN, 40, { characterSpacing: 1 });
  doc.fillColor(NATURE_500).fontSize(8).font('Helvetica-Bold')
    .text('CIRCULAR ECONOMY NETWORK', MARGIN, 68, { characterSpacing: 2 });

  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
    .text('LONG-TERM WASTE SUPPLY CONTRACT', MARGIN, 100);
  
  doc.fillColor(SLATE_400).fontSize(9).font('Helvetica')
    .text(`CONTRACT REFERENCE: LTC-${contract._id.toString().toUpperCase()}`, MARGIN, 130);
  doc.text(`ISSUED ON: ${new Date(contract.createdAt).toLocaleDateString()}`, MARGIN, 142);

  let y = 190;

  // ─── 1. PARTIES ──────────────────────────────────────────────
  doc.fillColor(NAVY_MID).fontSize(14).font('Helvetica-Bold').text('1. CONTRACTING PARTIES', MARGIN, y);
  y += 25;
  doc.rect(MARGIN, y, PAGE_W - (MARGIN * 2), 1).fill(BORDER_COLOR);
  y += 20;

  const BOX_W = (PAGE_W - (MARGIN * 2) - 20) / 2;
  
  // Proposer Box
  doc.rect(MARGIN, y, BOX_W, 65).fill('#f8fafc');
  doc.rect(MARGIN, y, BOX_W, 65).lineWidth(0.5).stroke(BORDER_COLOR);
  doc.fillColor(SLATE_400).fontSize(8).font('Helvetica-Bold').text('PROPOSER (ISSUER)', MARGIN + 12, y + 10);
  doc.fillColor(NAVY_MID).fontSize(11).font('Helvetica-Bold').text(proposer.name, MARGIN + 12, y + 25);
  doc.fillColor(SLATE_400).fontSize(9).font('Helvetica').text(proposer.email, MARGIN + 12, y + 40);
  doc.text(`Role: ${proposer.role}`, MARGIN + 12, y + 52);

  // Receiver Box
  doc.rect(MARGIN + BOX_W + 20, y, BOX_W, 65).fill('#f8fafc');
  doc.rect(MARGIN + BOX_W + 20, y, BOX_W, 65).lineWidth(0.5).stroke(BORDER_COLOR);
  doc.fillColor(SLATE_400).fontSize(8).font('Helvetica-Bold').text('RECEIVER (COUNTERPARTY)', MARGIN + BOX_W + 32, y + 10);
  doc.fillColor(NAVY_MID).fontSize(11).font('Helvetica-Bold').text(receiver.name, MARGIN + BOX_W + 32, y + 25);
  doc.fillColor(SLATE_400).fontSize(9).font('Helvetica').text(receiver.email, MARGIN + BOX_W + 32, y + 40);
  doc.text(`Role: ${receiver.role}`, MARGIN + BOX_W + 32, y + 52);

  y += 100;

  // ─── 2. SUPPLY TERMS ─────────────────────────────────────────
  doc.fillColor(NAVY_MID).fontSize(14).font('Helvetica-Bold').text('2. TERMS OF SUPPLY', MARGIN, y);
  y += 25;
  doc.rect(MARGIN, y, PAGE_W - (MARGIN * 2), 1).fill(BORDER_COLOR);
  y += 20;

  const drawRow = (label, value, currentY) => {
    doc.fillColor(SLATE_400).fontSize(10).font('Helvetica-Bold').text(label, MARGIN + 10, currentY);
    doc.fillColor(NAVY_MID).fontSize(10).font('Helvetica').text(value, MARGIN + 220, currentY, { align: 'right', width: PAGE_W - MARGIN * 2 - 230 });
    doc.rect(MARGIN, currentY + 18, PAGE_W - MARGIN * 2, 0.5).fill('#f1f5f9');
    return currentY + 32;
  };

  y = drawRow('Material Specification', contract.wasteType, y);
  y = drawRow('Monthly Commitment', `${contract.monthlyQuantityKg.toLocaleString()} KG`, y);
  y = drawRow('Agreed Price per KG', `LKR ${contract.pricePerKg.toLocaleString()}`, y);
  y = drawRow('Agreement Duration', `${contract.durationMonths} Months`, y);
  y = drawRow('Total Contract Estimate', `LKR ${(contract.pricePerKg * contract.monthlyQuantityKg * contract.durationMonths).toLocaleString()}`, y);

  y += 20;

  // ─── 3. CUSTOM PROVISIONS ────────────────────────────────────
  if (contract.customTerms) {
    doc.fillColor(NAVY_MID).fontSize(14).font('Helvetica-Bold').text('3. CUSTOM PROVISIONS', MARGIN, y);
    y += 25;
    doc.rect(MARGIN, y, PAGE_W - (MARGIN * 2), 1).fill(BORDER_COLOR);
    y += 20;
    
    doc.fillColor(NAVY_MID).fontSize(10).font('Helvetica').text(contract.customTerms, MARGIN + 10, y, { 
      width: PAGE_W - (MARGIN * 2) - 30, // Slightly more padding
      lineGap: 4,
      align: 'justify'
    });
    
    // Set 'y' to wherever PDFKit ended up naturally after text formatting, accounting for any page breaks
    y = doc.y + 40;
  }

  // ─── 4. BINDING SIGNATURES ───────────────────────────────────
  // Ensure enough room for signatures, or start a new page
  if (y > PAGE_H - 250) {
    doc.addPage();
    y = 50;
  }

  doc.fillColor(NAVY_MID).fontSize(14).font('Helvetica-Bold').text('4. BINDING SIGNATURES', MARGIN, y);
  y += 25;
  doc.rect(MARGIN, y, PAGE_W - (MARGIN * 2), 1).fill(BORDER_COLOR);
  y += 30;

  const axios = require('axios');
  const fetchImage = async (url) => {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data, 'binary');
    } catch (err) {
      return null;
    }
  };

  const drawSig = async (label, url, startX, startY) => {
    doc.fillColor(SLATE_400).fontSize(9).font('Helvetica-Bold').text(label.toUpperCase(), startX, startY);
    doc.rect(startX, startY + 15, BOX_W, 100).fill('#fdfdfd');
    doc.rect(startX, startY + 15, BOX_W, 100).lineWidth(0.5).dash(4, { space: 2 }).stroke(BORDER_COLOR);
    doc.undash();

    if (url) {
      const img = await fetchImage(url);
      if (img) {
        doc.image(img, startX + 10, startY + 25, { fit: [BOX_W - 20, 80], align: 'center', valign: 'center' });
      } else {
        doc.fillColor(SLATE_400).fontSize(8).text('Digital Signature Record', startX, startY + 55, { align: 'center', width: BOX_W });
      }
    } else {
      doc.fillColor(SLATE_400).fontSize(8).text('Awaiting Signature', startX, startY + 55, { align: 'center', width: BOX_W });
    }
    
    doc.fillColor(NAVY_MID).fontSize(8).font('Helvetica').text('Digitally Verified via WasteWise Auth', startX, startY + 120);
  };

  await drawSig('Buyer Signature', contract.buyerSignatureUrl, MARGIN, y);
  await drawSig('Seller Signature', contract.sellerSignatureUrl, MARGIN + BOX_W + 20, y);
};

// @desc    Mutually confirm and establish contract
// @route   POST /api/contracts/:id/confirm
// @access  Private
const confirmContract = async (req, res) => {
  try {
    const contract = await LongTermContract.findById(req.params.id)
      .populate('proposerId', 'name email role')
      .populate('receiverId', 'name email role');

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!contract.buyerSignatureUrl || !contract.sellerSignatureUrl) {
      return res.status(400).json({ message: 'Both parties must sign before confirming' });
    }

    const userId = req.user.id;
    if (contract.proposerId._id.toString() === userId) {
      contract.proposerConfirmed = true;
    } else if (contract.receiverId._id.toString() === userId) {
      contract.receiverConfirmed = true;
    } else {
      return res.status(403).json({ message: 'Not authorized to confirm this contract' });
    }

    if (contract.proposerConfirmed && contract.receiverConfirmed) {
      contract.status = 'active';

      // 1. Generate PDF Buffer for Email Attachment
      let pdfBuffer = null;
      try {
        const doc = new PDFDocument({ margin: 0, size: 'LETTER' });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        
        await drawLongTermContract(doc, { 
          contract, 
          proposer: contract.proposerId, 
          receiver: contract.receiverId 
        });
        doc.end();

        pdfBuffer = await new Promise((resolve) => {
          doc.on('end', () => resolve(Buffer.concat(chunks)));
        });
      } catch (pdfErr) {
        console.error("Failed to generate PDF for email attachment:", pdfErr);
      }

      const attachment = pdfBuffer ? {
        filename: `Contract_${contract._id}.pdf`,
        content: pdfBuffer
      } : null;
      
      // Trigger Notifications only when fully active
      await sendNotification(
        contract.proposerId._id,
        'contract_established',
        `Success! The long-term contract for ${contract.wasteType} is now active. The signed PDF is attached.`,
        contract._id,
        attachment
      );
      await sendNotification(
        contract.receiverId._id,
        'contract_established',
        `Success! The long-term contract for ${contract.wasteType} is now active. The signed PDF is attached.`,
        contract._id,
        attachment
      );
    } else {
      const otherPartyId = contract.proposerId._id.toString() === userId ? contract.receiverId._id : contract.proposerId._id;
      await sendNotification(
        otherPartyId,
        'contract_signed', // Reuse signed type or add 'contract_confirmed'
        `The other party has confirmed the terms. Awaiting your confirmation to establish the contract.`,
        contract._id
      );
    }

    await contract.save();

    res.status(200).json({ 
      message: contract.status === 'active' ? 'Contract established successfully' : 'Confirmation recorded', 
      contract 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error confirming contract' });
  }
};

// @desc    Download Contract PDF
// @route   GET /api/contracts/:id/download
// @access  Private
const downloadContract = async (req, res) => {
  try {
    const contract = await LongTermContract.findById(req.params.id)
      .populate('proposerId', 'name email role')
      .populate('receiverId', 'name email role');

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    const doc = new PDFDocument({ margin: 0, size: 'LETTER' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Contract_${contract._id}.pdf`);
    doc.pipe(res);

    await drawLongTermContract(doc, {
      contract,
      proposer: contract.proposerId,
      receiver: contract.receiverId
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating PDF' });
  }
};

module.exports = {
  proposeContract,
  getMyContracts,
  editContract,
  signContract,
  confirmContract,
  downloadContract
};
