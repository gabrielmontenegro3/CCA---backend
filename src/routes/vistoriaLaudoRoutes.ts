import { Router } from 'express';
import { vistoriaLaudoController } from '../controllers/vistoriaLaudoController';
import { vistoriaLaudoMensagemController } from '../controllers/vistoriaLaudoMensagemController';
import { vistoriaLaudoArquivoController } from '../controllers/vistoriaLaudoArquivoController';
import multer from 'multer';

const router = Router();

// Configurar multer para múltiplos arquivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 10 // Máximo 10 arquivos
  }
});

// Middleware de upload que aceita qualquer nome de campo para arquivos
const uploadAny = upload.any();

// ============================================
// ROTAS DE LAUDO
// ============================================

// GET /api/vistoria-laudos - Listar laudos (com filtro opcional ?chamado_id=)
router.get('/', vistoriaLaudoController.getAll);

// GET /api/vistoria-laudos/:id - Detalhar laudo (com mensagens e arquivos)
router.get('/:id', vistoriaLaudoController.getById);

// POST /api/vistoria-laudos - Criar laudo
router.post('/', vistoriaLaudoController.create);

// PUT /api/vistoria-laudos/:id - Atualizar laudo
router.put('/:id', vistoriaLaudoController.update);

// DELETE /api/vistoria-laudos/:id - Excluir laudo (cascade deleta mensagens e arquivos)
router.delete('/:id', vistoriaLaudoController.delete);

// ============================================
// ROTAS DE MENSAGENS
// ============================================

// POST /api/vistoria-laudos/:vistoria_laudo_id/mensagens - Criar mensagem (com arquivos opcionais)
router.post('/:vistoria_laudo_id/mensagens', uploadAny, vistoriaLaudoMensagemController.create);

// GET /api/vistoria-laudos/:vistoria_laudo_id/mensagens - Listar mensagens de um laudo
router.get('/:vistoria_laudo_id/mensagens', vistoriaLaudoMensagemController.getByLaudoId);

// ============================================
// ROTAS DE ARQUIVOS
// ============================================

// POST /api/vistoria-laudos/:vistoria_laudo_id/arquivos - Upload de arquivos diretamente ao laudo
router.post('/:vistoria_laudo_id/arquivos', uploadAny, vistoriaLaudoArquivoController.upload);

// GET /api/vistoria-laudos/:vistoria_laudo_id/arquivos - Listar arquivos de um laudo (opcional: ?mensagem_id=)
router.get('/:vistoria_laudo_id/arquivos', vistoriaLaudoArquivoController.getByLaudoId);

// GET /api/vistoria-laudos/arquivos/:id/download - Obter URL de download de um arquivo (opcional: ?expires_in=)
router.get('/arquivos/:id/download', vistoriaLaudoArquivoController.getDownloadUrl);

// DELETE /api/vistoria-laudos/arquivos/:id - Deletar arquivo
router.delete('/arquivos/:id', vistoriaLaudoArquivoController.delete);

export default router;

