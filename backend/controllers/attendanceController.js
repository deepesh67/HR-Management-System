const Attendance = require('../models/Attendance');

// @desc    Mark attendance
// @route   POST /api/attendance/mark
// @access  Private
const markAttendance = async (req, res, next) => {
    try {
        const { status } = req.body; // Present or Absent

        // Get current date (set to start of day for comparison)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // STRICT REQUIREMENT: Prevent future attendance
        if (startOfDay > now) {
            return res.status(400).json({ message: 'Attendance cannot be marked for future dates' });
        }

        // Check if attendance already marked for today
        const existing = await Attendance.findOne({
            userId: req.user._id,
            date: {
                $gte: startOfDay,
                $lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existing) {
            return res.status(400).json({ message: 'Attendance already marked for today' });
        }

        const attendance = await Attendance.create({
            userId: req.user._id,
            date: startOfDay,
            status: status || 'Present'
        });

        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user attendance history
// @route   GET /api/attendance/my
// @access  Private
const getMyAttendance = async (req, res, next) => {
    try {
        const attendance = await Attendance.find({ userId: req.user._id }).sort({ date: -1 });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all attendance records (Admin only)
// @route   GET /api/attendance/all
// @access  Private/Admin
const getAllAttendance = async (req, res, next) => {
    try {
        const { date, search } = req.query;
        let query = {};

        if (date) {
            const startOfDay = new Date(date);
            query.date = {
                $gte: startOfDate(startOfDay),
                $lt: new Date(startOfDate(startOfDay).getTime() + 24 * 60 * 60 * 1000)
            };
        }

        if (search) {
            // Find users matching search term (name or email)
            const User = require('../models/User');
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            
            const userIds = users.map(u => u._id);
            query.userId = { $in: userIds };
        }

        const attendance = await Attendance.find(query)
            .populate('userId', 'name email role')
            .sort({ date: -1 });
            
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper to get start of date
const startOfDate = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

module.exports = {
    markAttendance,
    getMyAttendance,
    getAllAttendance
};
