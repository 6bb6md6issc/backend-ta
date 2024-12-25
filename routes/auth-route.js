import express from 'express';
import { signup, 
    login, 
    logout, 
    verifyEmail, 
    forgotPassword, 
    resetPassword, 
    checkAuth, 
    updateProfile, 
    verify,
    addJob,
    getJobs,
    getJob,
    applyForJob,
    checkApplicationStatus,
    getMyJobPost,
    getProfile,
    getMyProfile,
    getMyApplications,
    editJob,
    deleteJob
} from '../controllers/auth-controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/signup', signup);

router.post('/login', login);

router.post('/logout', logout);

router.post('/verify-email', verifyEmail);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password/:token', resetPassword);

router.get('/verify-email/:token', verifyToken, checkAuth);

router.put('/update-profile', verifyToken, updateProfile); 

router.get('/verify', verifyToken, verify);

router.post('/add-job', addJob);

router.get('/jobs', getJobs);

router.get('/jobs/:id', getJob);

router.post('/jobs/:id/apply', verifyToken, applyForJob);

router.get('/jobs/:id/check-application', verifyToken, checkApplicationStatus);

router.get('/my-posts', verifyToken, getMyJobPost);

router.get('/profile/:userId', verifyToken, getProfile);

router.get('/profile', verifyToken, getMyProfile);

router.get('/my-applications', verifyToken, getMyApplications);

router.put('/edit-job/:id', verifyToken, editJob);

router.delete('/delete-job/:id', verifyToken, deleteJob);

export default router;