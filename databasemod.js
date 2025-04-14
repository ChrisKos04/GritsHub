// models/User.js - For recipients
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    verificationStatus: {
        isVerified: {
            type: Boolean,
            default: false
        },
        ebtNumber: String,
        verificationDate: Date
    },
    reservations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodItem'
    }],
    pickupHistory: [{
        foodItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodItem'
        },
        pickupDate: Date,
        rating: Number,
        feedback: String
    }],
    role: {
        type: String,
        default: 'recipient'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);

// models/Business.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BusinessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    businessType: {
        type: String,
        enum: ['grocery', 'restaurant', 'bakery', 'cafe', 'other'],
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    verificationStatus: {
        isVerified: {
            type: Boolean,
            default: false
        },
        businessLicense: String,
        verificationDate: Date
    },
    operatingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    foodItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodItem'
    }],
    impactMetrics: {
        totalDonated: Number,
        carbonSaved: Number,
        peopleHelped: Number
    },
    role: {
        type: String,
        default: 'business'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
BusinessSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
BusinessSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Business', BusinessSchema);

// models/FoodItem.js
const mongoose = require('mongoose');

const FoodItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['produce', 'bakery', 'dairy', 'meat', 'prepared', 'pantry', 'other'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    quantityUnit: {
        type: String,
        required: true
    },
    expirationDate: {
        type: Date,
        required: true
    },
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    imageUrl: String,
    nutritionInfo: {
        calories: Number,
        allergens: [String]
    },
    pickupWindow: {
        start: Date,
        end: Date
    },
    status: {
        type: String,
        enum: ['available', 'reserved', 'completed', 'expired'],
        default: 'available'
    },
    reservedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reservationTime: Date,
    environmentalImpact: {
        carbonSaved: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FoodItem', FoodItemSchema);