// middleware/auth.js
const jwt = require('jsonwebtoken');

// Authentication middleware
exports.auth = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');
        
        // Check if no token
        if (!token) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user data to request
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Business-only middleware
exports.businessOnly = (req, res, next) => {
    try {
        if (req.user && req.user.role === 'business') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Business accounts only' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error in authorization' });
    }
};

// Recipient-only middleware
exports.recipientOnly = (req, res, next) => {
    try {
        if (req.user && req.user.role === 'recipient') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Recipient accounts only' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error in authorization' });
    }
};

// utils/ebtVerification.js
// This is a mock service for EBT verification
// In a production app, you would integrate with actual government APIs

/**
 * Verifies an EBT/SNAP number with a mock service
 * @param {string} ebtNumber - The EBT number to verify
 * @returns {Promise<Object>} - Result of verification
 */
exports.verifyEBT = async (ebtNumber) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For development purposes, we'll accept any number that:
    // - Is 16 digits long
    // - Starts with '4' (like a VISA card)
    const isValid = /^4\d{15}$/.test(ebtNumber);
    
    return {
        isValid,
        message: isValid ? 'EBT number verified successfully' : 'Invalid EBT number format'
    };
};

// utils/validation.js
// Validation helper functions

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
exports.validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid
 */
exports.validatePassword = (password) => {
    // At least 8 chars, with at least one letter and one number
    const re = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    return re.test(password);
};

// utils/notifications.js
// This is a mock notification service
// In a production app, this would integrate with:
// - Email services (SendGrid, Mailgun)
// - SMS services (Twilio)
// - Push notification services (Firebase Cloud Messaging)

/**
 * Sends a notification to users or businesses
 * @param {string} type - Type of notification
 * @param {Object} data - Data to include in notification
 * @param {Object} recipient - Recipient details (optional)
 */
exports.sendNotification = (type, data, recipient = null) => {
    // Log the notification (in production, send actual notifications)
    console.log(`Sending "${type}" notification with data:`, data);
    
    // If recipient is specified, log that too
    if (recipient) {
        console.log(`Recipient: ${recipient.name} (${recipient.email})`);
    }
    
    // Implement actual notification sending logic here
    // Example:
    // if (type === 'new-food-item') {
    //     sendPushNotification(data);
    //     sendEmailNotification(data);
    // }
};