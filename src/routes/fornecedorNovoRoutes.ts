import { Router } from 'express';
import { fornecedorNovoController } from '../controllers/fornecedorNovoController';

const router = Router();

router.get('/', fornecedorNovoController.getAll);
router.get('/:id', fornecedorNovoController.getById);
router.post('/', fornecedorNovoController.create);
router.put('/:id', fornecedorNovoController.update);
router.delete('/:id', fornecedorNovoController.delete);

export default router;
