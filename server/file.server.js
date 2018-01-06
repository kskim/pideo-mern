import gridfs from 'mongoose-gridfs'; // https://www.npmjs.com/package/mongoose-gridfs
import fs from 'fs';
import ffmpeg from 'ffmpeg';
import Additional from './models/additional';
import { exec } from 'child_process';

const ENCODING_QUEUE = [];
let CURRENT_QUEUE = {};
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
      if (vttNames && vttNames.length > 0) {
        const originId = values.filter(val => val[video])[0][video];
        const targetId = values.filter(val => val[vttNames[0]])[0][vttNames[0]];
        addLink(originId, targetId, 'subtitle', 'ko');
      }

      // 이미지 연결
      const imageNames = images.filter(image => getFilenameWithoutExtension(image) === getFilenameWithoutExtension(video));
      if (imageNames && imageNames.length > 0) {
        const originId = values.filter(val => val[video])[0][video];
        const targetId = values.filter(val => val[imageNames[0]])[0][imageNames[0]];
        addLink(originId, targetId, 'image', '');
      }
      return null;
    });
  });
};

const encodingToMp4Job = (_id) => {
  return new Promise(resolve => {
    const Attachment = getAttachment();
    Attachment.findOne({ _id }, (err, att) => {
      if (err) {
        console.err(err);
        resolve(false);
        return;
      }
      const readStream = att.read();
      const nonSpaceFilename = (att.filename).replace(/ /gi, '_');
      const path = TEMP_PATH + nonSpaceFilename;
      const filename = getFilenameWithoutExtension(nonSpaceFilename) + '_ffmpeg.mp4';
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
        console.log('temp file write finish, 인코딩 시작');
        //tag update
        Attachment.update({ _id }, { $push: { 'metadata.tags': 'encoded' } }).then(console.log, console.error);
        const cmd = 'ffmpeg -threads 4 -i ' + path + ' ' + TEMP_PATH + filename;
        exec(cmd, { maxBuffer: 500 * 1024 }, (err, stdout, stderr) => {
          if (err) {
            console.error('인코딩중 파일 저장 에러', err);
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
                }
              });

              // 파일 링크
              const additional = new Additional();
              additional.fileId = _id;
              additional.linkValue = collection._id;
              additional.linkType = 'link';
              additional.save((err, add) => console.log(err, add));

              const additional2 = new Additional();
              additional2.fileId = collection._id;
              additional2.linkValue = _id;
              additional2.linkType = 'link';
              additional2.save((err, add) => console.log(err, add));

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
                  //encoded
                  resolve(true);
                }
              });
            });
        });
      });
    });
  });
};

export const encodingToMp4 = (_id, force = false) => {
  console.log('아무 기능 하지 않음 자동으로 인코딩됨');
};

export default (server) => {
  // encoding job
  console.log('encoding job start');
  let promise = null;
  setInterval(() => {
    if (!promise) {
      // 인코딩 필요한 대상건을 조회한다.
      const Attachment = getAttachment();
      Attachment.findOne({ $and: [{ 'metadata.tags': { $nin: ['encoded'] } }, { 'metadata.tags': { $in: ['avi', 'mkv', 'wmv'] } }] }).exec((err, att) => {
        if (err) {
          console.error(err);
          return;
        }
        if (att) {
          console.log('인코딩이 필요한 영상을 찾음', att);
          promise = encodingToMp4Job(att._id);
          promise.then(() => {
            console.log('encoding end');
            promise = null;
          });
        }
      });
    }
  }, 5000);
};
