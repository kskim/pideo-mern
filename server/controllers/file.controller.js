import { getAttachment } from '../file.server';
import iconv from 'iconv-lite';

export function getFile(req, res) {
  const Attachment = getAttachment();
  Attachment.findOne({ _id: req.params._id }).exec((err, file) => {
    if (err) {
      res.status(500).send(err);
    }

    res.json({ file });
  });
}
export function getFiles(req, res) {
  const Attachment = getAttachment();
  Attachment.find().sort('-uploadDate').exec((err, files) => {
    if (err) {
      res.status(500).send(err);
    }
    res.json({ files });
  });
}

export function deleteFile(req, res) {
  const Attachment = getAttachment();
  Attachment.unlinkById(req.params._id, (err, unlinkedAttachment) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
      return;
    }

    res.status(200).end();
  });
}

export function getStream(req, res) {
  const Attachment = getAttachment();
  Attachment.findOne({"_id" : req.params._id}, (err, collection) => {
    const stream = collection.read();
    console.log(collection);
    const strContents = new Buffer(collection.filename);
    const filename = iconv.decode(strContents, 'ISO-8859-1').toString(); //크롬에서는 한글파일 다운시 오류 난다.
    res.set('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.set('Content-Type', collection.contentType);
    res.set('Content-Length', collection.length);
    res.set('Accept-Ranges', 'bytes');
    res.set('Content-Range', 'bytes 0-' + collection.length + '/' + collection.length);
    res.set('Connection', 'keep-alive');

    stream.pipe(res).on('error', (err) => {
      console.log('An error occurred!', err);
      throw err;
    });

    res.on('finish', (err) => {
      console.log('File streaming end');
    });

  });
}
