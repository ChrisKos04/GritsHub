// controllers/foodController.js
const FoodItem = require('../models/FoodItem');
const Business = require('../models/Business');
const User = require('../models/User');
const { sendNotification } = require('../utils/notifications');

// Create a new food item listing
exports.createFoodItem = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            quantity,
            quantityUnit,
            expirationDate,
            nutritionInfo,
            pickupWindow,
            imageUrl
        } = req.body;

        // Get business ID from authenticated user
        const businessId = req.user.id;

        // Verify business exists
        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }

        // Calculate environmental impact (simple estimation)
        // You would use more sophisticated calculations in production
        const carbonSaved = quantity * 2.5; // kg CO2 equivalent (example value)

        // Create food item
        const foodItem = new FoodItem({
            name,
            description,
            category,
            quantity,
            quantityUnit,
            expirationDate,
            business: businessId,
            imageUrl,
            nutritionInfo,
            pickupWindow,
            environmentalImpact: {
                carbonSaved
            }
        });

        await foodItem.save();

        // Add food item to business's list
        business.foodItems.push(foodItem._id);
        
        // Update impact metrics
        business.impactMetrics.totalDonated = (business.impactMetrics.totalDonated || 0) + quantity;
        business.impactMetrics.carbonSaved = (business.impactMetrics.carbonSaved || 0) + carbonSaved;
        
        await business.save();

        // Notify nearby eligible users (in a real app)
        // This would be more sophisticated with geolocation filtering
        sendNotification('new-food-item', foodItem);

        res.status(201).json({
            message: 'Food item listed successfully',
            foodItem
        });
    } catch (error) {
        console.error('Food item creation error:', error);
        res.status(500).json({ message: 'Server error during food item listing' });
    }
};

// Get all available food items with filters
exports.getFoodItems = async (req, res) => {
    try {
        const {
            category,
            businessId,
            expiryDate,
            maxDistance,
            latitude,
            longitude
        } = req.query;

        // Build query object
        const query = { status: 'available' };

        // Apply filters
        if (category) query.category = category;
        if (businessId) query.business = businessId;
        if (expiryDate) {
            // Find items expiring after the specified date
            query.expirationDate = { $gte: new Date(expiryDate) };
        }

        // Execute query
        let foodItems = await FoodItem.find(query)
            .populate('business', 'name address phoneNumber businessType')
            .sort({ expirationDate: 1 }); // Sort by expiration, soonest first

        // Filter by distance if coordinates provided (simplified)
        // In production, you would use MongoDB's geospatial queries
        if (latitude && longitude && maxDistance) {
            foodItems = foodItems.filter(item => {
                // Check if business has location data
                if (!item.business.address || !item.business.address.coordinates) {
                    return false;
                }
                
                // Calculate distance (using Haversine formula)
                const distance = calculateDistance(
                    latitude,
                    longitude,
                    item.business.address.coordinates.latitude,
                    item.business.address.coordinates.longitude
                );
                
                return distance <= maxDistance;
            });
        }

        res.json({ foodItems });
    } catch (error) {
        console.error('Error fetching food items:', error);
        res.status(500).json({ message: 'Server error while fetching food items' });
    }
};

// Reserve a food item
exports.reserveFoodItem = async (req, res) => {
    try {
        const { foodItemId } = req.params;
        const userId = req.user.id;

        // Find the food item
        const foodItem = await FoodItem.findById(foodItemId);
        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Check if item is available
        if (foodItem.status !== 'available') {
            return res.status(400).json({ message: 'Food item is no longer available' });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is verified
        if (!user.verificationStatus.isVerified) {
            return res.status(403).json({ 
                message: 'You must verify your EBT/SNAP eligibility before reserving items' 
            });
        }

        // Update food item status
        foodItem.status = 'reserved';
        foodItem.reservedBy = userId;
        foodItem.reservationTime = Date.now();
        await foodItem.save();

        // Update user reservations
        user.reservations.push(foodItemId);
        await user.save();

        // Notify business of reservation
        const business = await Business.findById(foodItem.business);
        if (business) {
            // In a real app, this would send an email/SMS/push notification
            console.log(`Notifying business ${business.name} of reservation`);
            sendNotification('food-reserved', { foodItem, user: { name: user.name, phone: user.phoneNumber } }, business);
        }

        res.json({
            message: 'Food item reserved successfully',
            reservation: {
                foodItem,
                pickupWindow: foodItem.pickupWindow,
                businessDetails: {
                    name: business.name,
                    address: business.address,
                    phoneNumber: business.phoneNumber
                }
            }
        });
    } catch (error) {
        console.error('Error reserving food item:', error);
        res.status(500).json({ message: 'Server error while reserving food item' });
    }
};

// Complete pickup process
exports.completePickup = async (req, res) => {
    try {
        const { foodItemId } = req.params;
        const { feedback, rating } = req.body;
        
        // Check if the request is from a user or business
        const isUser = req.user.role === 'recipient';
        const actorId = req.user.id;

        // Find the food item
        const foodItem = await FoodItem.findById(foodItemId);
        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Check if item is reserved
        if (foodItem.status !== 'reserved') {
            return res.status(400).json({ message: 'Food item is not currently reserved' });
        }

        // Verify authority to complete pickup
        if (isUser && foodItem.reservedBy.toString() !== actorId.toString()) {
            return res.status(403).json({ message: 'You did not reserve this item' });
        } else if (!isUser && foodItem.business.toString() !== actorId.toString()) {
            return res.status(403).json({ message: 'This is not your food item listing' });
        }

        // Update food item status
        foodItem.status = 'completed';
        await foodItem.save();

        // Update user's pickup history if user is completing
        if (isUser) {
            const user = await User.findById(actorId);
            if (user) {
                // Remove from active reservations
                user.reservations = user.reservations.filter(
                    id => id.toString() !== foodItemId.toString()
                );
                
                // Add to pickup history
                user.pickupHistory.push({
                    foodItem: foodItemId,
                    pickupDate: Date.now(),
                    rating,
                    feedback
                });
                
                await user.save();
            }

            // Update business metrics
            const business = await Business.findById(foodItem.business);
            if (business) {
                business.impactMetrics.peopleHelped = (business.impactMetrics.peopleHelped || 0) + 1;
                await business.save();
            }
        }

        res.json({
            message: 'Pickup completed successfully',
            foodItem
        });
    } catch (error) {
        console.error('Error completing pickup:', error);
        res.status(500).json({ message: 'Server error while completing pickup' });
    }
};

// Helper function to calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    // Simple implementation of the Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
}

// routes/foodRoutes.js
const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { auth, businessOnly, recipientOnly } = require('../middleware/auth');

// Food item listing (business only)
router.post('/', auth, businessOnly, foodController.createFoodItem);

// Get available food items (public)
router.get('/', foodController.getFoodItems);

// Reserve a food item (recipient only)
router.post('/:foodItemId/reserve', auth, recipientOnly, foodController.reserveFoodItem);

// Complete pickup (both business and recipient)
router.post('/:foodItemId/complete', auth, foodController.completePickup);

module.exports = router;