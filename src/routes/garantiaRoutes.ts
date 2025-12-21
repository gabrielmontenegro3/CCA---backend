import { Router } from 'express';
import { garantiaController } from '../controllers/garantiaController';

const router = Router();

// Rotas CRUD para garantias
router.get('/', garantiaController.getAll);
router.get('/:id', garantiaController.getById);
router.post('/', garantiaController.create);
router.put('/:id', garantiaController.update);
router.delete('/:id', garantiaController.delete);

export default router;
