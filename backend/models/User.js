const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['employee', 'admin'],
        default: 'employee'
    },
    dateOfJoining: {
        type: Date,
        default: Date.now
    },
    leaveBalance: {
        type: Number,
        default: 20
    },
    employeeId: {
        type: String,
        unique: true,
        sparse: true
    },
    department: {
        type: String,
        default: 'General'
    },
    jobTitle: {
        type: String,
        default: 'Employee'
    },
    phoneNumber: {
        type: String
    },
    workLocation: {
        type: String,
        default: 'On-site'
    },
    managerName: {
        type: String
    },
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Intern', 'Contract'],
        default: 'Full-time'
    }
}, {
    timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
