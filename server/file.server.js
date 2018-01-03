import ioServer from 'socket.io';
import ioStream from 'socket.io-stream';
import gridfs from 'mongoose-gridfs'; // https://www.npmjs.com/package/mongoose-gridfs
import fs from 'fs';
import ffmpeg from 'ffmpeg';


const TEMP_PATH = __dirname + '/../temp/';
const connection = global.mongoose_connect;

export const getGfs = () => {
  return gridfs({
    collection: 'attachments',
    model: 'Attachment',
    mongooseConnection: connection,
  });
};

export const getAttachment = () => {
  return getGfs().model;
};

export const save = (fields, files) => {
  const tags = fields.tags ? fields.tags.split(',') : null;
  const rating = fields.rating ? parseInt(fields.rating, 10) : 1;
  Object.keys(files).forEach((filename => {
    const contentType = files[filename].type;
    const { path } = files[filename];
    const stream = fs.createReadStream(path);

    const Attachment = getAttachment();

    Attachment.write({
      filename,
      contentType,
      metadata: { rating, tags },
    }
      , stream
      , (err, collection) => {
        if (err) {
          console.error(err);
        }
        console.log('write success.', collection.filename);
        // 임시파일 삭제
        fs.unlink(path, (err) => { // This Deletes The Temporary File
          if (err) console.error(err);
          console.log(filename + ' temp file is deleted.');
        });
      });
  }));
};

export const encodingToMp4 = (_id, force = false) => {
  const Attachment = getAttachment();
  Attachment.findOne({ _id }, (err, att) => {
    if (err) {
      console.err(err);
      return;
    }
    if (att.metadata.process && !force) {
      return;
    }
    Attachment.update({ _id }, { $set: { 'metadata.process': true } }).then(console.log, console.error);
    const readStream = att.read();
    const path = TEMP_PATH + att._id + '.' + att.filename.split('.').pop();
    const filename = att._id + '_ffmpeg.mp4';
    const writeStream = fs.createWriteStream(path);
    const rating = att.metadata.rating;
    let tags = att.metadata.tags;
    if (Array.isArray(tags)) {
      tags.push('ffmpeg');
    } else {
      tags = ['ffmpeg'];
    }
    readStream.pipe(writeStream);
    writeStream.on('finish', () => {
      console.log('finish');
      new ffmpeg(path, (err, video) => {
        // -threads 4 -i
        video.addCommand('-threads', 4);

        video.save(TEMP_PATH + filename, (err, file) => {
          if (err) {
            console.error(err);
            return;
          }
          // 임시파일 삭제
          fs.unlink(path, (err) => { // This Deletes The Temporary File
            if (err) console.error(err);
            console.log(path + ' is deleted.');
          });
          console.log('encoding finish');
          const contentType = 'video/mp4';
          Attachment.write({
            filename,
            contentType,
            metadata: { rating, tags },
          }
          , fs.createReadStream(TEMP_PATH + filename)
          , (err, collection) => {
            if (err) {
              console.error(err);
            }
            console.log('write success.', collection.filename);
            // 임시파일 삭제
            fs.unlink(TEMP_PATH + filename, (err) => { // This Deletes The Temporary File
              if (err) console.error(err);
              console.log(filename + ' encoding file is deleted.');
              Attachment.update({ _id }, { $set: { 'metadata.process': false } }).then(console.log, console.error);
            });
          });
        });
      });
    });
  });
};

export default (server) => {
  const io = ioServer(server);
  const ss = ioStream;

  io.on('connection', (socket) => {
    ss(socket).on('file-transfer', (stream, data) => {
      const { filename, rating, tags, contentType } = data;

      const Attachment = getAttachment();

      Attachment.write({
        filename,
        contentType,
        metadata: { rating, tags },
      }
        , stream
        , (err, collection) => {
          if (err) {
            console.error(err);
          }
          console.log('write success.');
          socket.emit('file-transfer-success');
        });
    });
  });
};
