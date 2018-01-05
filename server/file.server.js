import ioServer from 'socket.io';
import ioStream from 'socket.io-stream';
import gridfs from 'mongoose-gridfs'; // https://www.npmjs.com/package/mongoose-gridfs
import fs from 'fs';
import ffmpeg from 'ffmpeg';
import Additional from './models/additional';

const ENCODING_QUEUE = [];
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

const getFilenameWithoutExtension = filename => {
  return filename.replace(/\.[^/.]+$/, '');
};

const addLink = (originId, targetId, linkType, linkInfo) => {
  const additional = new Additional();
  additional.fileId = originId;
  additional.linkValue = targetId;
  additional.linkType = linkType;
  additional.linkInfo = linkInfo;
  additional.save((err, add) => console.log(err, add));
};

export const save = (fields, files) => {
  const tags = fields.tags ? fields.tags.split(',') : [];
  const rating = fields.rating ? parseInt(fields.rating, 10) : 1;

  const requests = Object.keys(files).map(filename => {
    return new Promise(resolve => {
      const contentType = files[filename].type;
      const { path } = files[filename];
      const stream = fs.createReadStream(path);
      const Attachment = getAttachment();
      const localTags = tags.slice();
      localTags.push(filename.split('.').pop());

      Attachment.write({
        filename,
        contentType,
        'metadata': { rating, 'tags': localTags },
      }
        , stream
        , (err, collection) => {
          if (err) {
            console.error(err);
            resolve();
          } else {
            console.log('write success.', collection.filename);
            // 임시파일 삭제
            fs.unlink(path, (err) => { // This Deletes The Temporary File
              if (err) {
                console.error(err);
              } else {
                console.log(filename + ' temp file is deleted.');
              }
              const obj = {};
              obj[filename] = collection._id;
              resolve(obj);
            });
          }
        });
    });
  });

  Promise.all(requests).then((values) => {
    // 자막 파일 및 이미지 파일을 연결시켜준다.
    const videos = Object.keys(files).filter(filename => {
      const extension = filename.split('.').pop();
      return extension === 'mp4' || extension === 'webm' || extension === 'avi' || extension === 'wmv' || extension === 'mkv';
    });

    // 자막파일 목록
    const vtts = Object.keys(files).filter(filename => filename.split('.').pop() === 'vtt');

    const images = Object.keys(files).filter(filename => {
      const extension = filename.split('.').pop();
      return extension === 'jpeg' || extension === 'jpg' || extension === 'png';
    });

    // 연결해준다
    videos.forEach(video => {
      // 자막연결
      const vttNames = vtts.filter(vtt => getFilenameWithoutExtension(vtt) === getFilenameWithoutExtension(video));
      if (vttNames) {
        const originId = values.filter(val => val[video])[0][video];
        const targetId = values.filter(val => val[vttNames[0]])[0][vttNames[0]];
        addLink(originId, targetId, 'subtitle', 'ko');
      }

      // 이미지 연결
      const imageNames = images.filter(image => getFilenameWithoutExtension(image) === getFilenameWithoutExtension(video));
      if (imageNames) {
        const originId = values.filter(val => val[video])[0][video];
        const targetId = values.filter(val => val[imageNames[0]])[0][imageNames[0]];
        addLink(originId, targetId, 'image', '');
      }
    });
  });
};

const encodingToMp4Job = (_id, force = false) => {
  return new Promise(resolve => {
    const Attachment = getAttachment();
    Attachment.findOne({ _id }, (err, att) => {
      if (err) {
        console.err(err);
        resolve(false);
        return;
      }
      if (att.metadata.process && !force) {
        return;
      }
      Attachment.update({ _id }, { $set: { 'metadata.process': true } }).then(console.log, console.error);
      const readStream = att.read();
      const path = TEMP_PATH + att.filename;
      const filename = getFilenameWithoutExtension(att.filename) + '_ffmpeg.mp4';
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
              resolve(false);
              return;
            }
            // 임시파일 삭제
            fs.unlink(path, (err) => { // This Deletes The Temporary File
              if (err) {
                console.error(err);
                resolve(false);
              } else {
                console.log(path + ' is deleted.');
              }
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
                  resolve(false);
                }
                console.log('write success.', collection.filename);
                // 임시파일 삭제
                fs.unlink(TEMP_PATH + filename, (err) => { // This Deletes The Temporary File
                  if (err) {
                    console.error(err);
                    resolve(false);
                  } else {
                    console.log(filename + ' encoding file is deleted.');
                    Attachment.update({ _id }, { $set: { 'metadata.process': false } }).then(console.log, console.error);
                  }
                });

                // 파일 링크
                const additional = new Additional();
                additional.fileId = _id;
                additional.linkValue = collection._id;
                additional.linkType = 'link';
                additional.save((err, add) => console.log(err, add));

                // additional 복사
                Additional.find({ 'fileId': _id }).exec((err, adds) => {
                  if (err) {
                    console.error(err);
                    resolve(false);
                  } else {
                    adds.forEach(add => {
                      const additional = new Additional();
                      additional.fileId = collection._id;
                      additional.linkValue = add.linkValue;
                      additional.linkType = add.linkType;
                      additional.linkInfo = add.linkInfo;
                      additional.save((err, add) => console.log(err, add));
                    });
                    resolve(true);
                  }
                });
              });
          });
        });
      });
    });
  });
};

export const encodingToMp4 = (_id, force = false) => {
  ENCODING_QUEUE.push({ _id, force });
};

export default (server) => {
  // encoding job
  console.log('encoding job start');
  let promise = null;
  setInterval(() => {
    if (!promise) {
      const q = ENCODING_QUEUE.pop();
      if (q) {
        promise = encodingToMp4Job(q);
        promise.then(() => {
          console.log('encoding end');
          promise = null;
        });
      }
    }
  }, 5000);
};
