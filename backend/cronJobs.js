const cron = require('node-cron');
const Listing = require('./models/Listing');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');
const { sendNotification } = require('./controllers/notificationController');

const startCronJobs = () => {
  // Auction Closing Cron - runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Find active auctions that have past their endTime
      const expiredAuctions = await Listing.find({
        status: 'active',
        sellingMethod: 'auction',
        endTime: { $lte: now }
      }).populate('bids.userId', 'name email').populate('sellerId', 'name email');

      for (const listing of expiredAuctions) {
        if (listing.bids && listing.bids.length > 0) {
          listing.status = 'pending_payment';
          listing.paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
          
          const winningBid = listing.bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
          const winner = winningBid.userId;

          // Notify Winner
          await sendNotification(
            winner._id,
            'auction_won',
            `Congratulations! You won the auction for "${listing.wasteType}" with a bid of LKR ${winningBid.amount}. You have 24 hours to complete the payment via the Pending Payments tab in your dashboard.`,
            listing._id
          );

          // Create AuditLog for the win
          await AuditLog.create({
            userId: winner._id,
            action: 'Auction Won',
            details: `${winner.name} won the auction for "${listing.wasteType}" at LKR ${winningBid.amount}.`,
            type: 'transaction'
          });

          // Notify Seller
          await sendNotification(
            listing.sellerId._id,
            'auction_sold',
            `Your auction for "${listing.wasteType}" has ended successfully. The system is awaiting the buyer's secure payment within the next 24 hours.`,
            listing._id
          );

          // Notify Losers
          const uniqueBidders = [...new Set(listing.bids.map(b => b.userId._id?.toString() || b.userId.toString()))];
          const losers = uniqueBidders.filter(id => id !== (winner._id?.toString() || winner.toString()));
          
          for (const loserId of losers) {
             await sendNotification(
                loserId,
                'auction_lost',
                `You were outbid on "${listing.wasteType}". Don't let the next one get away! Check out our active listings and keep bidding to win more.`,
                listing._id
             );
          }
        } else {
          listing.status = 'no_bids';
          // Notify seller it ended without bids
          await sendNotification(
            listing.sellerId._id,
            'auction_ended_empty',
            `Your auction for "${listing.wasteType}" has ended without any bids.`,
            listing._id
          );
        }
        await listing.save();
      }
    } catch (error) {
       console.error('Error closing expired auctions:', error);
    }
  });

  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const inFortyFiveMins = new Date(now.getTime() + 45 * 60 * 1000);

      // Find active listings ending between 45 to 60 minutes from now
      // This ensures we only notify once per listing (since the cron runs every 15 mins)
      const endingListings = await Listing.find({
        status: 'active',
        endTime: {
          $gt: inFortyFiveMins,
          $lte: inOneHour
        }
      });

      if (endingListings.length === 0) return;

      for (const listing of endingListings) {
        // Find users who have this listing in their watchlist
        const usersToNotify = await User.find({ watchlist: listing._id });
        
        for (const user of usersToNotify) {
          await sendNotification(
            user._id,
            'ending_soon',
            `Reminder: The auction for "${listing.wasteType}" on your watchlist is ending in 1 hour. Get your final bids in!`,
            listing._id
          );
        }
      }
    } catch (error) {
      console.error('Error in cron job ending_soon alert:', error);
    }
  });

  // 48-Hour Payment Timeout Cron - runs every minute for testing
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Find pending payments that missed the deadline
      const defaultedListings = await Listing.find({
        status: 'pending_payment',
        paymentDeadline: { $lte: now }
      }).populate('bids.userId', 'name email').populate('sellerId', 'name email');

      for (const listing of defaultedListings) {
        let defaultingBuyer = null;
        if (listing.bids && listing.bids.length > 0) {
           const highestBid = listing.bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
           defaultingBuyer = highestBid.userId;

           // 1. Record the default in the listing history
           if (!listing.defaultedBids) listing.defaultedBids = [];
           listing.defaultedBids.push({
             userId: defaultingBuyer._id,
             amount: highestBid.amount,
             date: new Date()
           });

           // 2. Create official AuditLog for the platform activity feed
           await AuditLog.create({
             userId: defaultingBuyer._id,
             action: 'Payment Defaulted',
             details: `Buyer ${defaultingBuyer.name} failed to pay for listing "${listing.wasteType}" (LKR ${highestBid.amount}) within the 24h deadline.`,
             type: 'system_alert'
           });
        }

        // Bonus: 2nd highest bidder fallback logic
        if (listing.bids && listing.bids.length > 1) {
           // Sort bids highest to lowest
           const sortedBids = [...listing.bids].sort((a, b) => b.amount - a.amount);
           // Remove the defaulting highest bid from array
           listing.bids = listing.bids.filter(b => b._id.toString() !== sortedBids[0]._id.toString());
           
           // Relist to pending_payment for 2nd highest bidder
           const newWinner = sortedBids[1];
           listing.status = 'pending_payment';
           listing.paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // another 24 hours for 2nd buyer
           
           await sendNotification(
             newWinner.userId._id,
             'auction_won',
             `You've been assigned the win for "${listing.wasteType}" as the previous buyer defaulted. You have 24 hours to complete payment.`,
             listing._id
           );
           await sendNotification(
             listing.sellerId._id,
             'payment_defaulted',
             `The original highest bidder defaulted on payment. The auction has been reassigned to the 2nd highest bidder.`,
             listing._id
           );
        } else {
           // No backup bidder available, mark as failed
           listing.status = 'failed_payment';
           await sendNotification(
             listing.sellerId._id,
             'payment_defaulted',
             `The buyer defaulted on the 24-hour payment window for "${listing.wasteType}". The transaction has failed.`,
             listing._id
           );
        }

        await listing.save();

        if (defaultingBuyer) {
            // Find Admin users
            const admins = await User.find({ role: 'admin' });
            for (const admin of admins) {
               await sendNotification(
                 admin._id,
                 'admin_alert',
                 `System Alert: Buyer ${defaultingBuyer.name} (${defaultingBuyer.email}) defaulted on payment for Listing ${listing._id}.`,
                 listing._id
               );
            }
        }
      }
    } catch (error) {
       console.error('Error handling expired payments:', error);
    }
  });

  console.log('Background cron jobs started successfully.');
};

module.exports = startCronJobs;
