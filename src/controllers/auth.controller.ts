import { Request, Response } from 'express';
import { Resend } from 'resend';
import OTPModel from '../models/OTP';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { isValidEmail, isValidOTP } from '../utils/validators';
import dotenv from "dotenv";
dotenv.config();


const resend = new Resend(process.env.RESEND_API_KEY as string);

function genOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

export async function sendOTP(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) return res.status(400).json({ message: 'Invalid email' });
    const code = genOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OTPModel.findOneAndUpdate({ email }, { code, expiresAt }, { upsert: true, new: true });
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: email,
      subject: 'Your OTP Code',
      html: `<p>Your OTP is <strong>${code}</strong>. It expires in 5 minutes.</p>`
    });
    return res.json({ message: 'OTP sent' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
}

export async function verifyOTP(req: Request, res: Response) {
  try {
    const { email, code, name } = req.body;
    if (!email || !isValidEmail(email) || !code || !isValidOTP(code)) return res.status(400).json({ message: 'Invalid input' });
    const otpDoc = await OTPModel.findOne({ email });
    if (!otpDoc) return res.status(400).json({ message: 'No OTP requested' });
    if (otpDoc.code !== code) return res.status(400).json({ message: 'Invalid OTP' });
    if (otpDoc.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
    let user = await User.findOne({ email });
    if (!user) user = await User.create({ email, name, provider: 'email' });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '2h' });
    await OTPModel.deleteOne({ email });
    return res.json({ message: 'Authenticated', token, user: { email: user.email, name: user.name, provider: user.provider } });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to verify OTP', error: err.message });
  }
}

export async function handleGoogleLogin(profile: any, done: any) {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('No email in Google profile'));
    let user = await User.findOne({ email });
    if (!user) user = await User.create({ email, name: profile.displayName, googleId: profile.id, provider: 'google' });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}
