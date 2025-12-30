import { Router } from 'express';
import { imagemController } from '../controllers/imagemController';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// Rotas CRUD
router.get('/', imagemController.getAll);
router.get('/:id', imagemController.getById);
router.post('/upload', uploadSingle, imagemController.upload);
router.get('/:id/download', imagemController.download);
router.delete('/:id', imagemController.delete);

export default router;
