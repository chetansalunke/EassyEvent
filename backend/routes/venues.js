const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all venues
// @route   GET /api/v1/venues
// @access  Public
router.get('/', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get all venues',
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
});

// @desc    Get single venue
// @route   GET /api/v1/venues/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: `Get venue with id ${req.params.id}`,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
});

// @desc    Create new venue
// @route   POST /api/v1/venues
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    res.status(201).json({
      success: true,
      message: 'Create new venue',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
});

// @desc    Update venue
// @route   PUT /api/v1/venues/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: `Update venue with id ${req.params.id}`,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
});

// @desc    Delete venue
// @route   DELETE /api/v1/venues/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: `Delete venue with id ${req.params.id}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
});

module.exports = router;
