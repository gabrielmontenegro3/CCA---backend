import { Router } from 'express';
import { produtoController } from '../controllers/produtoController';

const router = Router();

router.get('/', produtoController.getAll);
router.get('/:id', produtoController.getById);
router.post('/', produtoController.create);
router.put('/:id', produtoController.update);
router.delete('/:id', produtoController.delete);

export default router;

