import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const additionalSchema = new Schema({
  fileId: { type: 'ObjectId', required: false },
  linkValue: { type: 'String', required: false },
  linkType: { type: 'String', required: true },
  linkInfo: { type: 'String', required: true },
  createdAt: { type: 'Date', default: Date.now, required: true },
});

export default mongoose.model('Additional', additionalSchema);
