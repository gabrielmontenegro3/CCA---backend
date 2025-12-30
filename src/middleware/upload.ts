import multer from 'multer';
import { Request } from 'express';

// Configurar multer para armazenar arquivos em memória
const storage = multer.memoryStorage();

// Filtro para aceitar apenas imagens
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Aceitar apenas imagens
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos'));
  }
};

// Configuração do multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

// Middleware para upload de uma única imagem
export const uploadSingle = upload.single('file');
