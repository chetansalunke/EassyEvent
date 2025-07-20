const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get all bookings',
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

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: `Get booking with id ${req.params.id}`,
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

// @desc    Create new booking
// @route   POST /api/v1/bookings
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    res.status(201).json({
      success: true,
      message: 'Create new booking',
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

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: `Update booking with id ${req.params.id}`,
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

// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: `Delete booking with id ${req.params.id}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
});

// @desc    Get user's bookings
// @route   GET /api/v1/bookings/my-bookings
// @access  Private
router.get('/my-bookings', auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get user bookings',
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

module.exports = router;
