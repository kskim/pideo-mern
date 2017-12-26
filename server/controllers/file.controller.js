import { getGfs } from '../socket.io.listen';
import iconv from 'iconv-lite';

export function getStream(req, res) {
  const gfs = getGfs();
  const Attachment = gfs.model;

  const stream = Attachment.readById(req.params.fileId);
  console.log(stream);
  res.set('Content-Type', 'video/webm');
  res.set('Content-Length', '680243');
  res.set('Accept-Ranges', 'bytes');
  res.set('Content-Range', 'bytes 0-680243/680243');
  res.set('Connection', 'keep-alive');

  stream.pipe(res).on('error', (err) => {
    console.log('An error occurred!', err);
    throw err;
  });

  res.on('finish', (err) => {
    console.log('File streaming end');
  });

}

export function getFile(req, res) {
  const gfs = getGfs();
  const Attachment = gfs.model;
  Attachment.findOne({"_id" : req.params.fileId}, (err, collection) => {
    const stream = collection.read();
    const strContents = new Buffer(collection.filename);
    const filename = iconv.decode(strContents, 'ISO-8859-1').toString(); //크롬에서는 한글파일 다운시 오류 난다.
    res.set('Content-Type', 'video/webm');
    res.set('Content-Disposition', 'attachment; filename="' + filename + '"');

    stream.pipe(res).on('error', (err) => {
      console.log('An error occurred!', err);
      throw err;
    });

    res.on('finish', (err) => {
      console.log('File streaming end');
    });

  });

}
