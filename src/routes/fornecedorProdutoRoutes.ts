import { Router } from 'express';
import { fornecedorProdutoController } from '../controllers/fornecedorProdutoController';

const router = Router();

router.get('/', fornecedorProdutoController.getAll);
router.post('/', fornecedorProdutoController.create);
router.put('/:fornecedor_id/:produto_id', fornecedorProdutoController.update);
router.delete('/:fornecedor_id/:produto_id', fornecedorProdutoController.delete);

export default router;



