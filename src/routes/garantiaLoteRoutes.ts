import { Router } from 'express';
import { garantiaLoteController } from '../controllers/garantiaLoteController';

const router = Router();

// Rotas CRUD para garantias de lote
router.get('/', garantiaLoteController.getAll);
router.get('/:id', garantiaLoteController.getById);
router.post('/', garantiaLoteController.create);
router.put('/:id', garantiaLoteController.update);
router.delete('/:id', garantiaLoteController.delete);

export default router;
