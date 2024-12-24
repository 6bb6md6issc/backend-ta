import mongoose, { isValidObjectId } from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ['student', 'instructor'],
        required: true,
    },
    coursework: {
        type: Object,
        required: false,
    },
    classStanding: {
        type: String,
        enum: ['Freshman', 'Sophomore', 'Junior', 'Senior'],
        required: false,
    },
    major: {
        type: String,
        enum: ['Computer Science', 'Electrical Engineering', 'Computer Engineering', 'Other'],
        required: false,
    },
    gpa: {
        type: Number,
        required: false,
    },


    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verificationToken: String,
    verificationTokenExpires: Date
});

const jobSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
        required: true,
    },
    jobDescription: {
        type: String,
        required: true,
    },
    employerEmail: {
        type: String,
        required: true,
    },
    employerPhone: {
        type: String,
        required: false,
    },
    datePosted: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    instructorEmail: {
        type: String,
        required: true,
    },
    applicants: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
    },
});

const User = mongoose.model('User', userSchema);
const Job = mongoose.model('Job', jobSchema);

export { User, Job };