import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  body?: string;
  createdAt: Date;
}

const NoteSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INote>('Note', NoteSchema);
