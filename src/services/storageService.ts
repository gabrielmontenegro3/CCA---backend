import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do S3 Client para Supabase Storage
const BUCKET_NAME = 'bucket_fotos_documentos';
const PROJECT_REF = 'fvkyqmvlqplgzdtybqhh';
const ACCESS_KEY = '7ee8c96a0c0431d4764ca1874b13db54';
const SECRET_KEY = '6fbc3c3b0944bdbb5821e752bd46fec283e6a766cdf23f4e54ef1b3d85644b3f';
const ENDPOINT = `https://${PROJECT_REF}.storage.supabase.co/storage/v1/s3`;
const REGION = 'us-east-1';

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

