import { Router } from 'express';
import { localController } from '../controllers/localController';

const router = Router();

router.get('/', localController.getAll);
router.get('/:id', localController.getById);
router.post('/', localController.create);
router.put('/:id', localController.update);
router.delete('/:id', localController.delete);

export default router;
