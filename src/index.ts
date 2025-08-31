
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { handleGoogleLogin } from './controllers/auth.controller';
import jwt from 'jsonwebtoken';
import path from 'path';

// ✅ Ensure dotenv loads the .env inside backend folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ✅ Debug log to check keys
console.log("RESEND KEY:", process.env.RESEND_API_KEY);
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// ✅ MongoDB connection
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/otpgoogle';
mongoose.connect(MONGO)
  .then(() => console.log('✅ Mongo connected'))
  .catch(err => console.error('❌ Mongo connection error', err));

// ✅ Google OAuth config
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  callbackURL: process.env.GOOGLE_CALLBACK_URL || ""
}, async (accessToken, refreshToken, profile, done) => {
  try {
    await handleGoogleLogin(profile, done);
  } catch (err) {
    done(err, undefined);
  }
}));

app.use(passport.initialize());

// ✅ Google auth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/?error=google`
  }),
  (req, res) => {
    const user = req.user as any;
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "fallbacksecret",
      { expiresIn: '2h' }
    );
    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);
  }
);

// ✅ API routes
app.use('/api', apiRoutes);

// ✅ Server start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
