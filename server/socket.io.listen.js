import ioServer from 'socket.io';
import fs from 'fs';
import gridfs from 'mongoose-gridfs';

const PIECE_SIZE = 1048576; // byte 단위(1M)
const FILE_MAP = {};
const TEMP_PATH = __dirname + '/../temp/';
const FILE_PATH = __dirname + '/../file/';

const connection = global.mongoose_connect;

export default (server) => {
  const io = ioServer(server);
  io.on('connection', (socket) => {
    socket.emit('protocol', { pieceSize: PIECE_SIZE });

    const gfs = gridfs({
      collection: 'attachments',
      model: 'Attachment',
      mongooseConnection: connection,
    });


    socket.on('file-transfer-ready', (data) => {
      console.log('file-transfer-ready');
      const fileName = data.fileName;

      FILE_MAP[fileName] = {
        fileSize: data.size,
        fileData: '',
        transferSize: 0,
        pieceIndex: 0,
      };

      try {
        const stat = fs.statSync(TEMP_PATH + fileName);
        if (stat.isFile()) {
          FILE_MAP[fileName].Downloaded = stat.size;
          FILE_MAP[fileName].pieceIndex = stat.size / PIECE_SIZE;
        }
      } catch (ignore) {
      }

      fs.open(TEMP_PATH + fileName, 'a+', (err, fd) => {
        if (err) console.log(err);
        else {
          FILE_MAP[fileName].handler = fd;
          socket.emit('file-transfer-continue', { 'pieceIndex': FILE_MAP[fileName].pieceIndex });
        }
      });
    });
    socket.on('file-transfer-data', (data) => {
      console.log('file-transfer-data');
      const fileName = data.fileName;
      const fileData = data.fileData;

      if (!fileData || !FILE_MAP[fileName]) return;

      FILE_MAP[fileName].transferSize += fileData.length;
      FILE_MAP[fileName].fileData += fileData;

      if (FILE_MAP[fileName].transferSize === FILE_MAP[fileName].fileSize) {
        fs.write(FILE_MAP[fileName].handler, FILE_MAP[fileName].fileData, null, 'Binary', (err) => {
          if (err) console.error(err);

          const Attachment = gfs.model;

          Attachment.write({
            filename: fileName,
            metadata: {
              tag: "123"
            }
          },
            fs.createReadStream(TEMP_PATH + fileName),
            () => {
              fs.close(FILE_MAP[fileName].handler, (err) => { // Close fs module
                if (err) console.error(err);
                fs.unlink(TEMP_PATH + fileName, (err) => { // This Deletes The Temporary File
                      // Moving File Completed
                  if (err) console.error(err);
                  console.log(fileName + ' is deleted.');
                });
              });
              socket.emit('file-transfer-complate', {});
            });

          // db.open((err) => {
          //   if (err) console.error(err);
          //   const readable = fs.createReadStream(TEMP_PATH + fileName);
          //   const writeStream = gfs.createWriteStream({
          //     filename: fileName,
          //     metadata: {
          //       writer: socket.id,
          //       serial: '12345678',
          //     },
          //   });
          //   readable.pipe(writeStream);
          //   writeStream.on('close', (file) => {
          //     console.log(file.filename + ' is written to DATABASE....');
          //     fs.close(FILE_MAP[fileName].handler, (err) => { // Close fs module
          //       if (err) console.error(err);
          //       fs.unlink(TEMP_PATH + fileName, (err) => { // This Deletes The Temporary File
          //         // Moving File Completed
          //         if (err) console.error(err);
          //         console.log(fileName + ' is deleted.');
          //       });
          //     });
          //   });
          // });

          // // Generate movie thumbnail
          // const readable = fs.createReadStream(TEMP_PATH + fileName);
          // const writable = fs.createWriteStream(FILE_PATH + fileName);
          // readable.pipe(writable);
          // writable.on('finish', (err) => {
          //   if (err) console.error(err);
          //   console.log(fileName + ' : writing is completed.');
          //   fs.close(FILE_MAP[fileName].handler, (err) => { // close fs module
          //     if (err) console.error(err);
          //     fs.unlink(TEMP_PATH + fileName, (err) => {
          //       // Moving File is Completed
          //       if (err) console.error(err);
          //       console.log(fileName + ' is deleted.');
          //     });
          //   });
          //   socket.emit('file-transfer-complate', {});
          // });
        });
      } else {
        fs.write(FILE_MAP[fileName].handler, FILE_MAP[fileName].fileData, null, 'Binary', (err) => {
          if (err) console.error(err);
          FILE_MAP[fileName].fileData = ''; // Reset The Buffer
          const pieceIndex = FILE_MAP[fileName].transferSize / PIECE_SIZE;
          socket.emit('file-transfer-continue', { pieceIndex });
        });
      }
    });
  });
};
