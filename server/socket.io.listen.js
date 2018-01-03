import ioServer from 'socket.io';
import fs from 'fs';
import gridfs from 'mongoose-gridfs'; // https://www.npmjs.com/package/mongoose-gridfs
import Post from './models/post';
import cuid from 'cuid';
import slug from 'limax';

const PIECE_SIZE = 1048576; // byte 단위(1M)
const FILE_MAP = {};
const TEMP_PATH = __dirname + '/../temp/';
const FILE_PATH = __dirname + '/../file/';

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

const initTempFile = (post, callback) => {
  const { fileName, size } = post;
  // 임시 파일을 준비한다
  FILE_MAP[fileName] = {
    fileSize: size,
    fileData: '',
    transferSize: 0,
    pieceIndex: 0,
  };

  try {
    const stat = fs.statSync(TEMP_PATH + fileName);
    if (stat.isFile()) {
      FILE_MAP[fileName].transferSize = stat.size;
      FILE_MAP[fileName].pieceIndex = stat.size / PIECE_SIZE;
      post.pieceIndex = FILE_MAP[fileName].pieceIndex;
      post.save();
    }
  } catch (ignore) {
  }

  fs.open(TEMP_PATH + fileName, 'a+', (err, fd) => {
    if (err) console.log(err);
    else {
      FILE_MAP[fileName].handler = fd;
      callback();
    }
  });
};

const addPost = (data, success, fail) => {
  const { fileName, size, title, tags, rating } = data;
  const newPost = new Post();
  newPost.cuid = cuid();
  newPost.fileName = fileName;
  newPost.size = size;
  newPost.title = title;
  newPost.tags = tags;
  newPost.rating = rating;
  newPost.pieceIndex = 0;
  newPost.slug = slug(title.toLowerCase(), { lowercase: true });
  newPost.save((err, saved) => {
    if (err) {
      console.error(err);
      fail();
    }
    success(saved);
  });
};

export default (server) => {
  const io = ioServer(server);
  io.on('connection', (socket) => {
    socket.emit('protocol', { pieceSize: PIECE_SIZE });

    const gfs = getGfs();

    socket.on('file-transfer-ready', (data) => {
      const { title } = data;

      // post 에 파일 이외의 정보를 담는다. 중복 채크 { fileName, size, title, tags, rating }
      Post.findOne({ title }).exec((err, post) => {
        if (err) console.log(err);
        if (post) {
          socket.emit('file-transfer-error', { 'message': 'already exist' });
        } else {
          addPost(
            data,
            (post) => {
              initTempFile(data, () => {
                socket.emit('file-transfer-continue', { 'pieceIndex': post.pieceIndex });
              });
            },
            () => {
              socket.emit('file-transfer-error', { 'message': 'add post fail' });
            }
          );
        }
      });
    });

    socket.on('file-transfer-data', (data) => {
      const fileName = data.fileName;
      const title = data.title;
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
            contentType: 'video/webm',
            metadata: {
              tag: '123',
            },
          },
            fs.createReadStream(TEMP_PATH + fileName),
            (err, collection) => {
              if (err) console.error(err);
              // todo: 저장
              fs.close(FILE_MAP[fileName].handler, (err) => { // Close fs module
                if (err) console.error(err);
                fs.unlink(TEMP_PATH + fileName, (err) => { // This Deletes The Temporary File
                  // Moving File Completed
                  if (err) console.error(err);
                  console.log(fileName + ' is deleted.');
                });
              });

              Post.findOne({ title }).exec((err, post) => {
                if (err) console.log(err);
                if (post) {
                  post.fileId = collection._id;
                  post.save();
                  console.debug(post);
                }
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
