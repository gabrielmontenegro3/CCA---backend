import { Router } from 'express';
import { fornecedorController } from '../controllers/fornecedorController';

const router = Router();

router.get('/', fornecedorController.getAll);
router.get('/:id', fornecedorController.getById);
router.post('/', fornecedorController.create);
router.put('/:id', fornecedorController.update);
router.delete('/:id', fornecedorController.delete);

export default router;




