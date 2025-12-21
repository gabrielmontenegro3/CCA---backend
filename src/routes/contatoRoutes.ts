import { Router } from 'express';
import { contatoController } from '../controllers/contatoController';

const router = Router();

router.get('/', contatoController.getAll);
router.post('/', contatoController.create);
router.put('/:id', contatoController.update);
router.delete('/:id', contatoController.delete);

export default router;




