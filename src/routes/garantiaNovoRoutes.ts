import { Router } from 'express';
import { garantiaNovoController } from '../controllers/garantiaNovoController';

const router = Router();

router.get('/', garantiaNovoController.getAll);
router.get('/:id', garantiaNovoController.getById);
router.post('/', garantiaNovoController.create);
router.put('/:id', garantiaNovoController.update);
router.delete('/:id', garantiaNovoController.delete);

export default router;
