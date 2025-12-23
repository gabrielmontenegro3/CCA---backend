import { Router } from 'express';
import { chamadoController } from '../controllers/chamadoController';

const router = Router();

// Rotas CRUD
router.get('/', chamadoController.getAll);
router.get('/:id', chamadoController.getById);
router.post('/', chamadoController.create);
router.put('/:id', chamadoController.update);
router.delete('/:id', chamadoController.delete);

// Rota específica para atualizar status
router.patch('/:id/status', chamadoController.updateStatus);

export default router;




