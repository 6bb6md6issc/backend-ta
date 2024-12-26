import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    try {
        console.log('Cookies received:', req.cookies);
        console.log('Headers:', req.headers);
        
        const token = req.cookies.token;
        console.log("Token found:", token ? 'Yes' : 'No');
        
        if (!token) {
            console.log("No token provided in cookies");
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
            message: 'Invalid token',
            error: error.message 
        });
    }
};