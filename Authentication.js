// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');
const { validateEmail, validatePassword } = require('../utils/validation');
const { verifyEBT } = require('../utils/ebtVerification');

// Register a new recipient
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, phoneNumber, address, ebtNumber } = req.body;

        // Validate input
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters and include letters and numbers' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            phoneNumber,
            address
        });

        // If EBT number provided, attempt verification
        if (ebtNumber) {
            try {
                const verificationResult = await verifyEBT(ebtNumber);
                if (verificationResult.isValid) {
                    user.verificationStatus = {
                        isVerified: true,
                        ebtNumber,
                        verificationDate: Date.now()
                    };
                }
            } catch (error) {
                console.error('EBT verification error:', error);
                // Continue with registration even if verification fails
            }
        }

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                verificationStatus: user.verificationStatus.isVerified,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Register a new business
exports.registerBusiness = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            phoneNumber, 
            businessType,
            address,
            operatingHours,
            businessLicense
        } = req.body;

        // Validate input
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters and include letters and numbers' 
            });
        }

        // Check if business already exists
        const existingBusiness = await Business.findOne({ email });
        if (existingBusiness) {
            return res.status(400).json({ message: 'Business already exists with this email' });
        }

        // Create new business
        const business = new Business({
            name,
            email,
            password,
            phoneNumber,
            businessType,
            address,
            operatingHours
        });

        // If business license provided, flag for manual verification
        if (businessLicense) {
            business.verificationStatus = {
                isVerified: false, // Requires manual verification
                businessLicense,
                verificationDate: null
            };
        }

        await business.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: business._id, role: business.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'Business registered successfully',
            token,
            business: {
                id: business._id,
                name: business.name,
                email: business.email,
                verificationStatus: business.verificationStatus.isVerified,
                role: business.role
            }
        });
    } catch (error) {
        console.error('Business registration error:', error);
        res.status(500).json({ message: 'Server error during business registration' });
    }
};

// Login for both users and businesses
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        let account;
        
        // Check if user exists based on role
        if (role === 'business') {
            account = await Business.findOne({ email });
        } else {
            account = await User.findOne({ email });
        }

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Verify password
        const isMatch = await account.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: account._id, role: account.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Send response based on account type
        if (role === 'business') {
            res.json({
                token,
                business: {
                    id: account._id,
                    name: account.name,
                    email: account.email,
                    verificationStatus: account.verificationStatus.isVerified,
                    role: account.role
                }
            });
        } else {
            res.json({
                token,
                user: {
                    id: account._id,
                    name: account.name,
                    email: account.email,
                    verificationStatus: account.verificationStatus.isVerified,
                    role: account.role
                }
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Verify EBT number for existing account
exports.verifyEBTNumber = async (req, res) => {
    try {
        const { userId, ebtNumber } = req.body;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Attempt EBT verification
        try {
            const verificationResult = await verifyEBT(ebtNumber);
            if (verificationResult.isValid) {
                user.verificationStatus = {
                    isVerified: true,
                    ebtNumber,
                    verificationDate: Date.now()
                };
                await user.save();
                
                return res.json({ 
                    message: 'EBT verification successful',
                    verificationStatus: user.verificationStatus
                });
            } else {
                return res.status(400).json({ message: 'Invalid EBT number' });
            }
        } catch (error) {
            console.error('EBT verification error:', error);
            return res.status(500).json({ message: 'Error during EBT verification' });
        }
    } catch (error) {
        console.error('EBT verification error:', error);
        res.status(500).json({ message: 'Server error during EBT verification' });
    }
};

// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Registration routes
router.post('/register/user', authController.registerUser);
router.post('/register/business', authController.registerBusiness);

// Login route
router.post('/login', authController.login);

// EBT verification route (protected)
router.post('/verify-ebt', auth, authController.verifyEBTNumber);

module.exports = router;