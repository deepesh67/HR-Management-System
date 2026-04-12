const express = require('express');
const router = express.Router();
const {
    applyLeave,
    getMyLeaves,
    updateLeave,
    deleteLeave,
    approveLeave,
    getAllLeaves
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/apply', protect, applyLeave);
router.get('/my', protect, getMyLeaves);
router.put('/update/:id', protect, updateLeave);
router.delete('/delete/:id', protect, deleteLeave);
router.delete('/:id', protect, deleteLeave);

// Admin only
router.put('/approve/:id', protect, authorize('admin'), approveLeave);
router.get('/all', protect, authorize('admin'), getAllLeaves);

module.exports = router;
