import { Router } from 'express';
import { chamadoController } from '../controllers/chamadoController';

const router = Router();

router.get('/', chamadoController.getAll);
router.get('/:id', chamadoController.getById);
router.post('/', chamadoController.create);
router.put('/:id', chamadoController.update);
router.patch('/:id/status', chamadoController.updateStatus);

export default router;




