import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const postSchema = new Schema({
  cuid: { type: 'String', required: true },
  slug: { type: 'String', required: true },
  title: { type: 'String', required: true },
  fileName: { type: 'String', required: true },
  fileId: { type: 'ObjectId', required: false },
  rating: { type: 'Number', required: false },
  size: { type: 'Number', required: false },
  pieceIndex: { type: 'Number', required: false },
  tags: { type: 'Array', required: false },
  createdAt: { type: 'Date', default: Date.now, required: true },
});

export default mongoose.model('Post', postSchema);
