import ioServer from 'socket.io';
import ioStream from 'socket.io-stream';
import gridfs from 'mongoose-gridfs'; // https://www.npmjs.com/package/mongoose-gridfs

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

export default (server) => {
  const io = ioServer(server);
  const ss = ioStream;

  io.on('connection', (socket) => {
    ss(socket).on('file-transfer', (stream, data) => {
      const { filename, size, title, rating, tags, contentType } = data;

      const Attachment = getAttachment();

      Attachment.write({
        filename,
        contentType,
        metadata: { size, title, rating, tags },
      }
        , stream
        , (err, collection) => {
          if (err) {
            console.error(err);
          }
          console.log(collection);
        });
    });
  });
};
