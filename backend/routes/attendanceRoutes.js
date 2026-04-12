const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getMyAttendance,
    getAllAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/mark', protect, markAttendance);
router.get('/my', protect, getMyAttendance);

// Admin only
router.get('/all', protect, authorize('admin'), getAllAttendance);

module.exports = router;
