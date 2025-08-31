import { Router } from 'express';
import { sendOTP, verifyOTP } from '../controllers/auth.controller';
import { createNote, deleteNote, listNotes } from '../controllers/notes.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/auth/send-otp', sendOTP);
router.post('/auth/verify-otp', verifyOTP);

router.get('/notes', authenticateJWT, listNotes);
router.post('/notes', authenticateJWT, createNote);
router.delete('/notes/:id', authenticateJWT, deleteNote);

export default router;
