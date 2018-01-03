import ioServer from 'socket.io';
import ioStream from 'socket.io-stream';
import gridfs from 'mongoose-gridfs'; // https://www.npmjs.com/package/mongoose-gridfs
import fs from 'fs';

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
