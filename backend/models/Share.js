import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    default: null,  // null = pas d'expiration
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  accessCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

shareSchema.index({ token: 1 });
shareSchema.index({ documentId: 1, ownerId: 1 });

const Share = mongoose.model('Share', shareSchema);
export default Share;