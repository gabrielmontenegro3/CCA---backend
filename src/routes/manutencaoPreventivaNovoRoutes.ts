import { Router } from 'express';
import { manutencaoPreventivaNovoController } from '../controllers/manutencaoPreventivaNovoController';

const router = Router();

router.get('/', manutencaoPreventivaNovoController.getAll);
router.get('/:id', manutencaoPreventivaNovoController.getById);
router.post('/', manutencaoPreventivaNovoController.create);
router.put('/:id', manutencaoPreventivaNovoController.update);
router.delete('/:id', manutencaoPreventivaNovoController.delete);

export default router;



