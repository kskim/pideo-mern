import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const additionalSchema = new Schema({
  fileId: { type: 'ObjectId', required: false },
  linkFileId: { type: 'ObjectId', required: false },
  linkType: { type: 'String', required: true },
  createdAt: { type: 'Date', default: Date.now, required: true },
});

export default mongoose.model('Additional', additionalSchema);
