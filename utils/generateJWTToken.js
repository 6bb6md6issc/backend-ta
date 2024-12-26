import jwt from 'jsonwebtoken';

export const generateJWTToken = (res, userID, email, role) => {
    console.log('Generating token with:', { userID, email, role }); // Debug log

    const token = jwt.sign(
        { 
            userID: userID,
            email: email,
            role: role, 
        }, 
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: '3.15.26.182',
        path: '/'
    });
    return token;
};