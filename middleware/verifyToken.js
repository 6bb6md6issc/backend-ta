import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request object
        req.userID = decoded.userID;
        req.userRole = decoded.role;  // Make sure this matches what's set in generateJWTToken
        req.userEmail = decoded.email;  // Add email from token
        
        next();
    } catch (error) {
        console.log("Token verification failed:", error);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};