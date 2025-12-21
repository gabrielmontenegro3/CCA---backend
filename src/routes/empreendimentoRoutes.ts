import { Router } from 'express';
import { empreendimentoController } from '../controllers/empreendimentoController';

const router = Router();

router.get('/', empreendimentoController.getAll);
router.get('/:id', empreendimentoController.getById);
router.post('/', empreendimentoController.create);
router.put('/:id', empreendimentoController.update);

export default router;

