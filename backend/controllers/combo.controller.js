import Combo from "../models/combo.js";
import { formatForAPI } from "../utils/timezone.js";

// Get all combos
export const getAllCombos = async (req, res, next) => {
  try {
    const { search = '' } = req.query;

    const query = { status: "active" };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const combos = await Combo.find(query).sort({ created_at: -1 });
    
    const formattedCombos = combos.map(combo => {
      const comboObj = combo.toObject();
      if (comboObj.created_at) {
        comboObj.created_at = formatForAPI(comboObj.created_at);
      }
      if (comboObj.updated_at) {
        comboObj.updated_at = formatForAPI(comboObj.updated_at);
      }
      return comboObj;
    });
    
    res.status(200).json({
      message: "Successfully retrieved the list of combos",
      data: formattedCombos,
      totalCount: formattedCombos.length
    });
  } catch (error) {
    next(error);
  }
};

// Get all combos for staff/admin (including inactive)
export const getAllCombosForStaff = async (req, res, next) => {
  try {
    const { search = '' } = req.query;

    const query = {}; // No status filter for staff/admin
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const combos = await Combo.find(query).sort({ created_at: -1 });
    
    const formattedCombos = combos.map(combo => {
      const comboObj = combo.toObject();
      if (comboObj.created_at) {
        comboObj.created_at = formatForAPI(comboObj.created_at);
      }
      if (comboObj.updated_at) {
        comboObj.updated_at = formatForAPI(comboObj.updated_at);
      }
      return comboObj;
    });
    
    res.status(200).json({
      message: "Successfully retrieved the list of combos (for staff/admin)",
      data: formattedCombos,
      totalCount: formattedCombos.length
    });
  } catch (error) {
    next(error);
  }
};

// Get combo by ID
export const getComboById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const combo = await Combo.findById(id);
    
    if (!combo) {
      return res.status(404).json({
        message: "Combo not found"
      });
    }
    
    const comboObj = combo.toObject();
    if (comboObj.created_at) {
      comboObj.created_at = formatForAPI(comboObj.created_at);
    }
    if (comboObj.updated_at) {
      comboObj.updated_at = formatForAPI(comboObj.updated_at);
    }
    
    res.status(200).json({
      message: "Successfully retrieved combo information",
      data: comboObj
    });
  } catch (error) {
    next(error);
  }
};

// Create a new combo (staff/admin only)
export const createCombo = async (req, res, next) => {
  try {
    const { name, description, price, image_url, status } = req.body;
    
    const combo = await Combo.create({
      name,
      description,
      price,
      image_url,
      status: status || "active"
    });
    
    const comboObj = combo.toObject();
    if (comboObj.created_at) {
      comboObj.created_at = formatForAPI(comboObj.created_at);
    }
    if (comboObj.updated_at) {
      comboObj.updated_at = formatForAPI(comboObj.updated_at);
    }
    
    res.status(201).json({
      message: "New combo created successfully",
      data: comboObj
    });
  } catch (error) {
    next(error);
  }
};

// Update a combo (staff/admin only)
export const updateCombo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const combo = await Combo.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!combo) {
      return res.status(404).json({
        message: "Combo not found"
      });
    }
    
    const comboObj = combo.toObject();
    if (comboObj.created_at) {
      comboObj.created_at = formatForAPI(comboObj.created_at);
    }
    if (comboObj.updated_at) {
      comboObj.updated_at = formatForAPI(comboObj.updated_at);
    }
    
    res.status(200).json({
      message: "Combo updated successfully",
      data: comboObj
    });
  } catch (error) {
    next(error);
  }
};

// Delete a combo (soft delete) (staff/admin only)
export const deleteCombo = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const combo = await Combo.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );
    
    if (!combo) {
      return res.status(404).json({
        message: "Combo not found"
      });
    }
    
    res.status(200).json({
      message: "Combo deleted successfully (marked as inactive)"
    });
  } catch (error) {
    next(error);
  }
};

// Update combo status (staff/admin only)
export const updateComboStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const existingCombo = await Combo.findById(id);
    if (!existingCombo) {
      return res.status(404).json({
        message: "Combo not found",
        error: "COMBO_NOT_FOUND"
      });
    }
    
    if (existingCombo.status === status) {
      return res.status(200).json({
        message: `Combo status is already '${status}'`,
        data: existingCombo,
        note: "No changes were made"
      });
    }
    
    const combo = await Combo.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    
    const comboObj = combo.toObject();
    if (comboObj.created_at) {
      comboObj.created_at = formatForAPI(comboObj.created_at);
    }
    if (comboObj.updated_at) {
      comboObj.updated_at = formatForAPI(comboObj.updated_at);
    }
    
    res.status(200).json({
      message: "Combo status updated successfully",
      data: comboObj,
      changes: {
        previousStatus: existingCombo.status,
        newStatus: status
      }
    });
  } catch (error) {
    next(error);
  }
};
