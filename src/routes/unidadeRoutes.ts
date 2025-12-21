import { Router } from 'express';
import { unidadeController } from '../controllers/unidadeController';
import { unidadeProdutoController } from '../controllers/unidadeProdutoController';

const router = Router();

router.get('/', unidadeController.getAll);
router.get('/:id', unidadeController.getById);
router.post('/', unidadeController.create);
router.put('/:id', unidadeController.update);

// Rotas para produtos da unidade
router.get('/:id/produtos', unidadeProdutoController.getProdutosByUnidade);
router.post('/:id/produtos', unidadeProdutoController.addProdutoToUnidade);

export default router;




