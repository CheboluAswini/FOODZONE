const Food = require('../models/foodModel');

// Get all food items
const getAllFoods = async (req, res) => {
  try {
    console.log('[FOOD] Fetching all foods');
    const { category, search, available } = req.query;
    
    let query = {};
    if (category && category !== 'all') query.category = category;
    if (available !== undefined) query.available = available === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const foods = await Food.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true,
      count: foods.length, 
      data: foods 
    });
    console.log(`[FOOD] Found ${foods.length} foods`);
  } catch (error) {
    console.error('[FOOD] Error fetching foods:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching foods",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add food (Admin only)
const addFood = async (req, res) => {
  try {
    console.log('[FOOD] Adding new food item');
    const { name, description, price, category } = req.body;
    const image = req.file ? req.file.filename : req.body.image;

    if (!name || !description || !price || !category || !image) {
      console.log('[FOOD] Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required: name, description, price, category, image" 
      });
    }

    const newFood = new Food({
      name,
      description,
      price: Number(price),
      category,
      image
    });

    await newFood.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Food item added successfully",
      data: newFood
    });
    console.log('[FOOD] Food item created:', newFood._id);
  } catch (error) {
    console.error('[FOOD] Error adding food:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error adding food item",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Remove food (Admin only)
const removeFood = async (req, res) => {
  try {
    const { id } = req.body;
    console.log('[FOOD] Removing food:', id);

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Food ID is required" 
      });
    }

    const food = await Food.findByIdAndDelete(id);

    if (!food) {
      console.log('[FOOD] Food not found:', id);
      return res.status(404).json({ 
        success: false, 
        message: "Food item not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Food item removed successfully"
    });
    console.log('[FOOD] Food removed:', id);
  } catch (error) {
    console.error('[FOOD] Error removing food:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error removing food item",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update food (Admin only)
const updateFood = async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    console.log('[FOOD] Updating food:', id);

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "Food ID is required" 
      });
    }

    const food = await Food.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!food) {
      console.log('[FOOD] Food not found:', id);
      return res.status(404).json({ 
        success: false, 
        message: "Food item not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Food item updated successfully",
      data: food
    });
    console.log('[FOOD] Food updated:', id);
  } catch (error) {
    console.error('[FOOD] Error updating food:', error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating food item",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { getAllFoods, addFood, removeFood, updateFood };
