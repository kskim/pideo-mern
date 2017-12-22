import { Router } from 'express';
import * as FileController from '../controllers/file.controller';
const router = new Router();

// get stream
router.route('/stream/:fileId').get(FileController.getStream);
router.route('/download/:fileId').get(FileController.getFile);

export default router;
