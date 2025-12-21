import { Router } from 'express';
import { produtoNovoController } from '../controllers/produtoNovoController';

const router = Router();

router.get('/', produtoNovoController.getAll);
router.get('/:id', produtoNovoController.getById);
router.post('/', produtoNovoController.create);
router.put('/:id', produtoNovoController.update);
router.delete('/:id', produtoNovoController.delete);

export default router;
