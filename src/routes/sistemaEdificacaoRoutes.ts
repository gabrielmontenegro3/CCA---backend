import { Router } from 'express';
import { sistemaEdificacaoController } from '../controllers/sistemaEdificacaoController';

const router = Router();

router.get('/', sistemaEdificacaoController.getAll);
router.get('/:id', sistemaEdificacaoController.getById);
router.post('/', sistemaEdificacaoController.create);
router.put('/:id', sistemaEdificacaoController.update);
router.delete('/:id', sistemaEdificacaoController.delete);

export default router;
