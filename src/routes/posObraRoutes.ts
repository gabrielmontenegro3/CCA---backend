import { Router } from 'express';
import { posObraController } from '../controllers/posObraController';

const router = Router();

// Rotas CRUD para pós-obra
router.get('/', posObraController.getAll);
router.get('/:id', posObraController.getById);
router.post('/', posObraController.create);
router.put('/:id', posObraController.update);
router.delete('/:id', posObraController.delete);

export default router;



