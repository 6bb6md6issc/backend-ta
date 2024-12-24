import {User, Job} from '../model/model.js';
import bcrypt from 'bcryptjs';
import { generateVerificationToken } from '../utils/generateVerificationToke.js';
import { generateJWTToken } from '../utils/generateJWTToken.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSucessEmail } from '../resend/email.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

export const signup = async (req,res)=>{
    const { name, email, password, role } = req.body;
    try {
        // check if all fields are filled
        if(!name || !email || !password || !role){ 
            console.log('At least one field is missing');
            return res.status(400).json({ message: 'All fields are required' });
        }
        // check if user already exists
        const userExists = await User.findOne({ email }); 
        if(userExists){
            console.log('User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        // generate the 6 digit verification token sent to the user's email
        const verificationToken = generateVerificationToken();
        // create the user in the database
        const user = new User({ 
            name: name, 
            email: email, 
            password: hashedPassword, 
            role: role, 
            verificationToken: verificationToken,
            verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });
        await user.save();
        generateJWTToken(res, user._id, user.role);
        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                ...user,
                password: undefined
            }
        });
    } catch(error){
        res.status(400).json({message: error.message});
    }
};

export const login = async(req,res)=>{
    const { email, password } = req.body;
    try{
        // check if the user exists (have registered)
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({ success: false, message: 'User not found' });
        }
        // check if the password is correct
        const PasswordMatch = await bcrypt.compare(password, user.password);
        if(!PasswordMatch){
            return res.status(400).json({ success: false, message: 'Invalid password' });
        }
        // check if the user is verified with given email
        if(!user.isVerified){
            return res.status(400).json({ success: false, message: 'User not verified' });
        }

        // Generate token with correct parameter order
        generateJWTToken(res, user._id, user.email, user.role);

        res.status(200).json({ 
            success: true, 
            message: 'Login successful',
            user: {
                role: user.role,
                email: user.email
            }
        });
    } catch(error){
        res.status(400).json({ success: false, message: error.message });
    }
};

export const logout = (req,res)=>{
    res.clearCookie('jwt');
    res.status(200).json({ sucess: true, message: 'Logged out successfully' });
};

export const verifyEmail = async (req,res)=>{
    const { code } = req.body;
    try{
        const user = await User.findOne({ verificationToken: code });
        if(!user){
            return res.status(400).json({
                success: false, 
                message: 'Invalid verification code'
            });
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();
        await sendWelcomeEmail(user.email, user.name);
        res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error){
        console.log("error with verifying email", error);
        res.status(400).json({message: error.message});
    }
};

export const forgotPassword = async (req,res)=>{
    const { email } = req.body;
    try{
        const user = await User.findOne({ email });
        if (!user){
            return res.status(400).json({ success:false, message: 'User not found' });
        }

        const resetPasswordToken = crypto.randomBytes(32).toString('hex');

        user.resetPasswordToken = resetPasswordToken;  
        user.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hours
        await user.save();
        await sendPasswordResetEmail(
            user.email, 
            `${process.env.FRONTEND_URL}/reset-password/${resetPasswordToken}`
        );
        res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully'
        }); 
    } catch(error){
        console.log("error with sending reset password email", error);
        res.status(400).json({sucess: false, message: error.message});
    }
};

export const resetPassword = async (req,res)=>{
    try{
        const { token } = req.params;
        const { password } = req.body;
        const user = await User.findOne({ 
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            return res.status(400).json({
                success: false, 
                message: "invalid or expired resetPasswordToken"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        await sendResetSucessEmail(user.email);
        res.status(200).json({success: true, message: "password reset successfully"})
    } catch(error){
        console.log("error reset password", error);
        res.status(400).json({sucess:false, message: error.message})
    }
};

export const checkAuth = async (req, res) => {
    try{
        const user = await User.findById(req.userID);
        if (!user){
            return res.status(400).json({success: false, message: "User not found"});
        }
        res.status(200).json({
            success: true, 
            user: {...user, password: undefined}
        });
    } catch(error){
        console.log("error checking auth", error);
        res.status(400).json({success: false, message: error.message});
    }
}

export const updateProfile = async (req, res) => {
    const { major, classStanding, gpa, courseGrades } = req.body;
    
    try {
        // Find user by ID (from token)
        const user = await User.findOne(req.email);
        
        if (!user) {
            console.log("user not found");
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update basic info
        if (major) user.major = major;
        if (classStanding) user.classStanding = classStanding;
        if (gpa) user.gpa = gpa;
        if (courseGrades) user.coursework = courseGrades;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                major: user.major,
                classStanding: user.classStanding,
                gpa: user.gpa,
                coursework: user.coursework
            }
        });

    } catch (error) {
        console.log("Error updating profile:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const verify = async (req, res) => {
    try {
        // The verifyToken middleware will have already checked the JWT token
        // and added the user ID to req.userID
        const user = await User.findById(req.userID);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                role: user.role,
                email: user.email
            }
        });
    } catch (error) {
        console.log("Error verifying auth:", error);
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

export const addJob = async (req, res) => {
    try{
        const { jobTitle, jobDescription, employerEmail, employerPhone, instructorEmail } = req.body;
        const job = new Job({ jobTitle, jobDescription, employerEmail, employerPhone, instructorEmail });
        await job.save();
        res.status(200).json({ success: true, message: 'Job added successfully' });
    } catch(error){
        console.log("error adding job", error);
        res.status(400).json({success: false, message: error.message});
    }
}

export const getJobs = async (req, res) => {
    try{
        const jobs = await Job.find();
        res.status(200).json({ success: true, jobs });
    } catch(error){
        console.log("error getting jobs", error);
        res.status(400).json({success: false, message: error.message});
    }
}

export const getJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id);
        
        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Job not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            job 
        });
    } catch(error) {
        console.log("error getting job", error);
        res.status(400).json({
            success: false, 
            message: error.message
        });
    }
}

export const applyForJob = async (req, res) => {
    try {
        const { id } = req.params; // job id
        const userId = req.userID; // from verifyToken middleware
        const role = req.userRole;

        // Find the job
        if (role !== 'student'){
            return res.status(400).json({
                success: false,
                message: 'Only students can apply for jobs'
            });
        }
        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if user has already applied
        if (job.applicants.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job'
            });
        }

        // Add user to applicants array
        job.applicants.push(userId);
        await job.save();

        res.status(200).json({
            success: true,
            message: 'Successfully applied for job'
        });
    } catch (error) {
        console.log("error applying for job", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const checkApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params; // job id
    const userId = req.userID; // from verifyToken middleware

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    const hasApplied = job.applicants.includes(userId);

    res.status(200).json({
      success: true,
      hasApplied
    });
  } catch (error) {
    console.log("error checking application status", error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getMyJobPost = async (req, res) => {
    try {
        console.log('User role:', req.userRole);
        console.log('User email:', req.userEmail);

        if (!req.userRole) {
            return res.status(403).json({
                success: false,
                message: "User role not found in token"
            });
        }

        if (req.userRole !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: `Unauthorized access. User role is ${req.userRole}, but instructor role is required`
            });
        }

        if (!req.userEmail) {
            return res.status(403).json({
                success: false,
                message: "User email not found in token"
            });
        }

        const jobs = await Job.find({ instructorEmail: req.userEmail })
            .populate('applicants', 'name email major classStanding gpa');
        
        console.log('Found jobs:', jobs);

        res.status(200).json({ 
            success: true, 
            jobs 
        });
    } catch(error) {
        console.log("Error getting my job posts:", error);
        res.status(400).json({
            success: false,
            message: error.message,
            details: error.stack
        });
    }
};

export const getProfile = async (req, res) => {
    try {
        // Check if user is an instructor
        if (req.userRole !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only instructors can view student profiles'
            });
        }

        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                major: user.major,
                classStanding: user.classStanding,
                gpa: user.gpa,
                coursework: user.coursework
            }
        });
    } catch (error) {
        console.log("Error fetching profile:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getMyProfile = async (req, res) => {
    try {
        // Check if user is a student
        if (req.userRole !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only students can access their profiles'
            });
        }

        // Get user ID from the token (added by verifyToken middleware)
        const user = await User.findById(req.userID);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user: {
                major: user.major,
                classStanding: user.classStanding,
                gpa: user.gpa,
                coursework: user.coursework
            }
        });
    } catch (error) {
        console.log("Error fetching profile:", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getMyApplications = async (req, res) => {
    try {
        if (req.userRole !== 'student'){
            return res.status(400).json({
                success: false,
                message: 'Access denied. Only students can view their applications'
            });
        }
        // Find jobs with only specific fields
        const applications = await Job.find({ 
            applicants: { $in: [req.userID] }
        })
        .select('employerEmail jobTitle _id');  // Only select these fields
        
        res.status(200).json({ success: true, applications });
    } catch (error) {
        console.log("Error fetching applications:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const editJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { jobTitle, jobDescription, employerEmail, employerPhone } = req.body;
        
        // Find the job
        const job = await Job.findById(id);
        
        if (!job) {
            return res.status(404).json({ 
                success: false, 
                message: 'Job not found' 
            });
        }

        // Check if the logged-in instructor is the owner of this job
        if (job.instructorEmail !== req.userEmail) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only edit your own job posts'
            });
        }

        // Update the job
        job.jobTitle = jobTitle;
        job.jobDescription = jobDescription;
        job.employerEmail = employerEmail;
        job.employerPhone = employerPhone;

        await job.save();

        res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            job
        });
    } catch (error) {
        console.log("Error editing job:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        await Job.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Job deleted successfully' });
    } catch (error) {
        console.log("Error deleting job:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};