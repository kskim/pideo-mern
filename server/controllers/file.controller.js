import { getAttachment, save } from '../file.server';
import iconv from 'iconv-lite';
import formidable from 'formidable';
import Additional from '../models/additional';
import mongoose from 'mongoose';


export function fileUploads(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(500).send(err);
    } else {
      save(fields, files);
      res.status(200).end();
    }
  });
}

export function modifyFile(req, res) {
  if (!req.body.tags && !req.body.rating) {
    res.status(403).end();
  }

  const tags = req.body.tags;
  const rating = req.body.rating;
  const Attachment = getAttachment();
  Attachment.findOne({ _id: req.params._id }).exec((err, file) => {
    if (err) {
      res.status(500).send(err);
    }

    if (tags) {
      file.metadata.tags = tags;
      Attachment.update({ _id: req.params._id }, { $set: { 'metadata.tags': tags } }).then(console.log, console.error);
    }

    if (rating) {
      file.metadata.rating = rating;
      Attachment.update({ _id: req.params._id }, { $set: { 'metadata.rating': parseInt(rating, 10) } }).then(console.log, console.error);
    }

    res.json({ file });
  });
}

export function getFile(req, res) {
  const Attachment = getAttachment();
  Attachment
    .aggregate([
      { $match: { _id: mongoose.Types.ObjectId(req.params._id) } },
      {
        $lookup: {
          from: 'additionals',
          localField: '_id',
          foreignField: 'fileId',
          as: 'additionals',
        },
      },
    ])
    // .findOne({ _id: req.params._id })
    .exec((err, files) => {
      if (err) {
        res.status(500).send(err);
      }
      const file = files[0];
      console.log(files);
      res.json({ file });
    });
}

export function addAdditional(req, res) {
  const { linkFileId, linkType } = req.body;
  const fileId = req.params._id;
  const additional = new Additional();
  additional.fileId = fileId;
  additional.linkFileId = linkFileId;
  additional.linkType = linkType;

  additional.save((err, saved) => {
    if (err) {
      res.status(500).send(err);
    } else {
      getFile(req, res);
    }
  });
}

export function deleteAdditional(req, res) {
  const _id = req.params._id;
  Additional.remove({ _id }, (err) => {
    if (err) {
      res.status(500).sned(err);
    }
    res.status(200).end();
  });
}

export function getFiles(req, res) {
  let query = {};

  if (req.query.tags) {
    const tags = req.query.tags.split(' ');
    query['metadata.tags'] = { $all: tags };
  }

  if (req.query.rating) {
    query['metadata.rating'] = { $gte: parseInt(req.query.rating, 10) };
  }

  const page = req.query.page;
  const Attachment = getAttachment();
  Attachment
    .aggregate([
      { $match: query },
      { $skip: (page - 1) * 20 },
      { $limit: 20 },
      {
        $lookup: {
          from: 'additional',
          localField: '_id',
          foreignField: 'fileId',
          as: 'additional',
        },
      },
    ])
    // .find(query).sort('-uploadDate').skip((page - 1) * 20).limit(20)
    .exec((err, files) => {
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
  Attachment.findOne({ '_id': req.params._id }, (err, collection) => {
    const stream = collection.read();
    const strContents = new Buffer(collection.filename);
    const filename = iconv.decode(strContents, 'ISO-8859-1').toString(); // 크롬에서는 한글파일 다운시 오류 난다.
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
