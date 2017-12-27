import { Router } from 'express';
import * as FileController from '../controllers/file.controller';
const router = new Router();

router.route('/files').get(FileController.getFiles);
router.route('/files/:_id').get(FileController.getFile);
router.route('/stream/:_id').get(FileController.getStream);
router.route('/files/:_id').delete(FileController.deleteFile);

export default router;
