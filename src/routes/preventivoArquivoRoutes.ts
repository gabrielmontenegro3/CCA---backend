import { Router } from 'express';
import { preventivoArquivoController } from '../controllers/preventivoArquivoController';

const router = Router();

router.get('/', preventivoArquivoController.getAll);
router.get('/:id', preventivoArquivoController.getById);
router.post('/', preventivoArquivoController.create);
router.put('/:id', preventivoArquivoController.update);
router.delete('/:id', preventivoArquivoController.delete);

export default router;
