import { Router } from 'express';
import { chamadoController } from '../controllers/chamadoController';
import multer from 'multer';

const router = Router();

// Configurar multer para múltiplos arquivos
// Aceita qualquer campo de arquivo (anexos, anexos[], files, etc.)
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

// Rotas CRUD
router.get('/', chamadoController.getAll);
router.get('/:id', chamadoController.getById);
router.post('/', uploadAny, chamadoController.create);
router.post('/:id/mensagens', uploadAny, chamadoController.enviarMensagem);
router.patch('/:id/status', chamadoController.updateStatus);

export default router;

