import express from 'express';
import { connectToDatabase } from './database/ConnectToDatabase.js';
import Route from './routes/auth-route.js';
import cookieParser from 'cookie-parser';
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cookieParser());
connectToDatabase();
app.use(cors({
    origin: 'http://localhost:3000', // frontend URL
    credentials: true,  // important for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/api/auth', Route);

app.listen(5001, () => {
    console.log('Server is running on port 5001');
});