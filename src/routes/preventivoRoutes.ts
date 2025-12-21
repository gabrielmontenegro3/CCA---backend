import { Router } from 'express';
import { preventivoController } from '../controllers/preventivoController';

const router = Router();

router.get('/', preventivoController.getAll);
router.get('/:id', preventivoController.getById);
router.post('/', preventivoController.create);
router.put('/:id', preventivoController.update);
router.delete('/:id', preventivoController.delete);

export default router;
