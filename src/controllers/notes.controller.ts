import { Request, Response } from 'express';
import Note from '../models/Note';

export async function createNote(req: Request, res: Response) {
  try {
    const { title, body } = req.body;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const note = await Note.create({ user: userId, title, body });
    return res.json({ note });
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to create note', error: err.message });
  }
}



export const deleteNote = async (req: Request, res: Response) => {
  try {
    // ensure user is logged in
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // find and delete in one query (safer + shorter)
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: userId
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found or not yours" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error deleting note" });
  }
};



export async function listNotes(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const notes = await Note.find({ user: userId }).sort({ createdAt: -1 });
    return res.json({ notes });
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to list notes', error: err.message });
  }
}
