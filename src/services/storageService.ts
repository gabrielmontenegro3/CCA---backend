import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do S3 Client para Supabase Storage
const BUCKET_NAME = 'bucket_fotos_documentos';
const PROJECT_REF = 'fvkyqmvlqplgzdtybqhh';
const ACCESS_KEY = '7ee8c96a0c0431d4764ca1874b13db54';
const SECRET_KEY = '6fbc3c3b0944bdbb5821e752bd46fec283e6a766cdf23f4e54ef1b3d85644b3f';
const ENDPOINT = `https://${PROJECT_REF}.storage.supabase.co/storage/v1/s3`;
const REGION = 'sa-east-1';

const s3Client = new S3Client({
  forcePathStyle: true,
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  }
});

/**
 * Faz upload de um arquivo para o storage e retorna URL assinada
 * @param file Arquivo (buffer e metadata)
 * @param folder Pasta onde salvar (ex: "chamados/1/anexos")
 * @returns URL assinada do arquivo (válida por 7 dias - máximo permitido pelo S3)
 */
export async function uploadFile(
  file: Express.Multer.File,
  folder: string = 'anexos'
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${folder}/${timestamp}_${file.originalname}`;

  const putObjectCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      originalName: file.originalname,
      uploadedAt: new Date().toISOString()
    }
  });

  await s3Client.send(putObjectCommand);

  // Gerar URL assinada (válida por 7 dias - máximo permitido pelo S3)
  const getObjectCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName
  });

  // Máximo permitido: 7 dias (604800 segundos)
  const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 604800 }); // 7 dias
  return url;
}

/**
 * Faz upload de múltiplos arquivos
 */
export async function uploadFiles(
  files: Express.Multer.File[],
  folder: string = 'anexos'
): Promise<string[]> {
  return Promise.all(files.map(file => uploadFile(file, folder)));
}

// ============================================
// FUNÇÕES ESPECÍFICAS PARA VISTORIA/LAUDO
// ============================================

// Usa o mesmo bucket, mas organiza em pasta específica
const PASTA_VISTORIA_LAUDOS = 'vistoria-laudos';

/**
 * Faz upload de arquivo para o bucket bucket_fotos_documentos na pasta vistoria-laudos
 * @param file Arquivo (buffer e metadata)
 * @param vistoriaLaudoId ID do laudo (UUID)
 * @returns Objeto com file_path (caminho no bucket) e file_name
 */
export async function uploadFileVistoriaLaudo(
  file: Express.Multer.File,
  vistoriaLaudoId: string
): Promise<{ file_path: string; file_name: string }> {
  const timestamp = Date.now();
  // Organiza em: vistoria-laudos/{laudo_id}/{timestamp}_{nome_arquivo}
  const fileName = `${PASTA_VISTORIA_LAUDOS}/${vistoriaLaudoId}/${timestamp}_${file.originalname}`;

  const putObjectCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      originalName: file.originalname,
      uploadedAt: new Date().toISOString(),
      vistoriaLaudoId
    }
  });

  await s3Client.send(putObjectCommand);

  return {
    file_path: fileName,
    file_name: file.originalname
  };
}

/**
 * Faz upload de múltiplos arquivos para vistoria-laudos
 */
export async function uploadFilesVistoriaLaudo(
  files: Express.Multer.File[],
  vistoriaLaudoId: string
): Promise<Array<{ file_path: string; file_name: string }>> {
  return Promise.all(
    files.map(file => uploadFileVistoriaLaudo(file, vistoriaLaudoId))
  );
}

/**
 * Gera URL assinada para arquivo do bucket bucket_fotos_documentos (pasta vistoria-laudos)
 * @param file_path Caminho do arquivo no bucket
 * @param expiresIn Tempo de expiração em segundos (padrão: 7 dias)
 * @returns URL assinada
 */
export async function getSignedUrlVistoriaLaudo(
  file_path: string,
  expiresIn: number = 604800 // 7 dias
): Promise<string> {
  const getObjectCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: file_path
  });

  return await getSignedUrl(s3Client, getObjectCommand, { expiresIn });
}

/**
 * Deleta arquivo do bucket bucket_fotos_documentos (pasta vistoria-laudos)
 */
export async function deleteFileVistoriaLaudo(
  file_path: string
): Promise<void> {
  const deleteObjectCommand = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: file_path
  });

  await s3Client.send(deleteObjectCommand);
}

