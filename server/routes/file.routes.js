import { Router } from 'express';
import * as FileController from '../controllers/file.controller';
const router = new Router();

router.route('/files').get(FileController.getFiles);
router.route('/files/:_id').get(FileController.getFile);
router.route('/files/:_id').post(FileController.modifyFile);
router.route('/stream/:_id').get(FileController.getStream);
router.route('/files/:_id').delete(FileController.deleteFile);
router.route('/fileUploads').post(FileController.fileUploads);
router.route('/addAdditional/:_id').post(FileController.addAdditional);
router.route('/addAdditional/:_id').delete(FileController.deleteAdditional);

export default router;
