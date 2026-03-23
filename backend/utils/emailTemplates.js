const path = require('path');

/**
 * Ultra-Luxury Dark Email Templates for WasteWise (V5)
 * Centered, balanced, and highly sophisticated 'Luxury Dark' aesthetic.
 */

const getBaseTemplate = (content, color = '#22c55e', title = 'WasteWise Alert', type = '', icon = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark only">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #020617; padding: 50px 0;">
        <tr>
            <td align="center">
                <!-- Outer Container -->
                <table width="580" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                    <!-- Centered Logo -->
                    <tr>
                        <td align="center" style="padding-bottom: 30px;">
                            <img src="cid:logo" alt="WasteWise" width="160" style="display: block;">
                        </td>
                    </tr>
                    
                    <!-- Premium Glassmorphism-style Card -->
                    <tr>
                        <td style="background-color: #0f172a; border-radius: 24px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                            
                            <!-- Accent Line -->
                            <div style="height: 4px; background: linear-gradient(to right, ${color}, #16a34a);"></div>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 40px;">
                                <!-- Status Badge -->
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <div style="display: inline-block; padding: 6px 16px; background-color: ${color}15; border: 1px solid ${color}30; border-radius: 100px;">
                                            <span style="font-size: 11px; font-weight: 700; color: ${color}; text-transform: uppercase; letter-spacing: 1.5px;">${type.replace('_', ' ')}</span>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Icon & Heading -->
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <div style="font-size: 48px; margin-bottom: 20px;">${icon}</div>
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -1px; line-height: 1.2;">${title}</h1>
                                    </td>
                                </tr>
                                
                                <!-- Message Body -->
                                <tr>
                                    <td align="center" style="padding-bottom: 35px;">
                                        <div style="font-size: 17px; line-height: 1.6; color: #94a3b8; max-width: 440px;">
                                            ${content}
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- CTA Button -->
                                <tr>
                                    <td align="center">
                                        <a href="#" style="display: inline-block; background: linear-gradient(135deg, ${color} 0%, #16a34a 100%); color: #ffffff; padding: 18px 45px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 16px; box-shadow: 0 10px 25px -5px ${color}40;">Access Dashboard</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Refined Footer -->
                    <tr>
                        <td align="center" style="padding-top: 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="color: #475569; font-size: 13px; font-weight: 500;">
                                        &copy; 2025 WasteWise Platform • Factory Hub Colombo
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 15px;">
                                        <a href="#" style="color: #64748b; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy</a>
                                        <span style="color: #1e293b;">•</span>
                                        <a href="#" style="color: #64748b; text-decoration: none; font-size: 12px; margin: 0 10px;">Security</a>
                                        <span style="color: #1e293b;">•</span>
                                        <a href="#" style="color: #64748b; text-decoration: none; font-size: 12px; margin: 0 10px;">Unsubscribe</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

const icons = {
    check: `✅`,
    alert: `⚠️`,
    info: `ℹ️`,
    bell: `🔔`,
    award: `🏆`,
    document: `📄`,
    bid: `🔨`
};

const templates = {
    success: (userName, message, type) => getBaseTemplate(`
        Hello <strong>${userName}</strong>,<br><br>
        Great news! ${message} We've updated your circular economy records to reflect this milestone.
    `, '#22c55e', 'Great Success!', type, icons.award),

    alert: (userName, message, type) => getBaseTemplate(`
        Hi <strong>${userName}</strong>,<br><br>
        This is an automated alert from our monitoring system. <strong>${message}</strong> Please review this event to maintain compliance.
    `, '#ef4444', 'Priority Alert', type, icons.alert),

    info: (userName, message, type) => getBaseTemplate(`
        Hello <strong>${userName}</strong>,<br><br>
        We've noticed a new update on your dashboard. <em>${message}</em> Stay informed and keep optimizing your factory's output.
    `, '#3b82f6', 'Status Updated', type, icons.info),

    admin: (userName, message, type) => getBaseTemplate(`
        <div style="background-color: #020617; border-radius: 12px; padding: 25px; border: 1px solid #1e293b; text-align: left; font-family: 'Fira Code', 'Courier New', monospace;">
            <p style="margin: 0; font-size: 13px; color: #22c55e; line-height: 1.6;">
                <span style="color: #64748b;">[${new Date().toISOString()}]</span><br>
                <span style="color: #ef4444;">&gt; SYSTEM_ALERT:</span> ${message}
            </p>
        </div>
    `, '#6366f1', 'Technical Log', type, icons.bell)
};

const getTemplate = (userName, message, type) => {
    switch (type.toLowerCase()) {
        case 'auction_won':
        case 'certificate':
        case 'agreement_created':
            return templates.success(userName, message, type);
        case 'outbid':
        case 'ending_soon':
        case 'payment_defaulted':
            return templates.alert(userName, message, type);
        case 'auction_sold':
        case 'auction_lost':
        case 'auction_ended_empty':
            return templates.info(userName, message, type);
        case 'admin_alert':
            return templates.admin(userName, message, type);
        default:
            return templates.info(userName, message, type);
    }
};

module.exports = { getTemplate };
