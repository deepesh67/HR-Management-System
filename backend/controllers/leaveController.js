const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Apply for leave
// @route   POST /api/leave/apply
// @access  Private
const applyLeave = async (req, res, next) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Calculate total days (inclusive)
        const timeDiff = end.getTime() - start.getTime();
        const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

        if (totalDays <= 0) {
            return res.status(400).json({ message: 'End date must be after or same as start date' });
        }

        const leave = await Leave.create({
            userId: req.user._id,
            leaveType,
            startDate,
            endDate,
            totalDays,
            reason
        });

        // Notify admins about new leave request
        const admins = await User.find({ role: 'admin' });
        const notifications = admins.map(admin => ({
            userId: admin._id,
            type: 'LEAVE_SUBMITTED',
            message: `${req.user.name} submitted a new ${leaveType} leave request for ${totalDays} days.`,
            link: '/admin',
            isRead: false
        }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user leaves
// @route   GET /api/leave/my
// @access  Private
const getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update pending leave
// @route   PUT /api/leave/update/:id
// @access  Private
const updateLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (leave.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // REQUIREMENT: Edit allowed ONLY if status = pending
        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: 'Cannot update leave that is already processed' });
        }

        // REQUIREMENT: Edit allowed ONLY if leave has NOT started yet
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(leave.startDate) < today) {
            return res.status(400).json({ message: 'Cannot edit leave that has already started or is in the past' });
        }

        const { leaveType, startDate, endDate, reason } = req.body;
        
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const timeDiff = end.getTime() - start.getTime();
            const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
            leave.totalDays = totalDays;
        }

        leave.leaveType = leaveType || leave.leaveType;
        leave.startDate = startDate || leave.startDate;
        leave.endDate = endDate || leave.endDate;
        leave.reason = reason || leave.reason;

        const updatedLeave = await leave.save();
        res.json(updatedLeave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete/Cancel pending leave
// @route   DELETE /api/leave/delete/:id
// @access  Private
const deleteLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // If not admin, restrict to own leaves and Pending status only
        if (req.user.role !== 'admin') {
            if (leave.userId.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            if (leave.status !== 'Pending') {
                return res.status(400).json({ message: 'Cannot delete leave that is already processed' });
            }
        }

        await leave.deleteOne();
        res.json({ message: 'Leave request removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or reject leave (Admin only)
// @route   PUT /api/leave/approve/:id
// @access  Private/Admin
const approveLeave = async (req, res) => {
    try {
        const { status } = req.body; // Approved or Rejected
        
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const leave = await Leave.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: 'Leave is already processed' });
        }

        // If approved, check and reduce balance
        if (status === 'Approved') {
            const user = await User.findById(leave.userId);
            if (!user) {
                return res.status(404).json({ message: 'Cannot approve: User account no longer exists.' });
            }
            if (user.leaveBalance < leave.totalDays) {
                return res.status(400).json({ message: 'Insufficient leave balance' });
            }
            user.leaveBalance -= leave.totalDays;
            await user.save();
        }

        leave.status = status;
        const updatedLeave = await leave.save();
        
        // Notify the employee about leave decision
        await Notification.create({
            userId: leave.userId,
            type: status === 'Approved' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
            message: `Your ${leave.leaveType} leave request for ${leave.totalDays} days has been ${status.toLowerCase()}.`,
            link: '/leave',
            isRead: false
        });

        res.json(updatedLeave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all leave requests (Admin only)
// @route   GET /api/leave/all
// @access  Private/Admin
const getAllLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    applyLeave,
    getMyLeaves,
    updateLeave,
    deleteLeave,
    approveLeave,
    getAllLeaves
};
