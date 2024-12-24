import express from 'express';
import { connectToDatabase } from './database/ConnectToDatabase.js';
import Route from './routes/auth-route.js';
import cookieParser from 'cookie-parser';
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cookieParser());
connectToDatabase();

const allowedOrigins = [
    'http://localhost:3000',
    'http://3.15.26.182:5001',
    'http://3.15.26.182'
];

app.use(cors({
    origin: function(origin, callback) {
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
            return callback(new Error('CORS policy: Origin not allowed'), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/auth', Route);

app.listen(5001, () => {
    console.log('Server is running on port 5001');
});