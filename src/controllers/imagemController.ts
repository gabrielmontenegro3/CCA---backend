import { Request, Response } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';
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

export const imagemController = {
  // Listar todas as imagens (com filtro opcional por chamado_id)
  getAll: async (req: Request, res: Response) => {
    try {
      const { chamado_id } = req.query;

      let query = supabase
        .from(TABELAS.IMAGENS)
        .select('*');

      // Filtrar por chamado_id se fornecido
      if (chamado_id) {
        query = query.eq('chamado_id', chamado_id);
      }

      const { data: imagens, error } = await query.order('id', { ascending: false });

      if (error) throw error;

      // Gerar URLs assinadas para cada imagem
      const imagensComUrl = await Promise.all(
        (imagens || []).map(async (imagem: any) => {
          try {
            const getObjectCommand = new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: imagem.path
            });

            const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 }); // URL válida por 1 hora
            return {
              ...imagem,
              url
            };
          } catch (urlError) {
            console.error(`Erro ao gerar URL para imagem ${imagem.id}:`, urlError);
            return {
              ...imagem,
              url: null,
              erro_url: 'Erro ao gerar URL'
            };
          }
        })
      );

      return res.json(imagensComUrl);
    } catch (error: any) {
      console.error('Erro ao listar imagens:', error);
      return res.status(500).json({ error: error.message || 'Erro ao listar imagens' });
    }
  },

  // Buscar imagem por ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const { data: imagem, error } = await supabase
        .from(TABELAS.IMAGENS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!imagem) {
        return res.status(404).json({ error: 'Imagem não encontrada' });
      }

      // Gerar URL assinada
      try {
        const getObjectCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: imagem.path
        });

        const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
        return res.json({
          ...imagem,
          url
        });
      } catch (urlError) {
        console.error('Erro ao gerar URL:', urlError);
        return res.json({
          ...imagem,
          url: null,
          erro_url: 'Erro ao gerar URL'
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar imagem:', error);
      return res.status(500).json({ error: error.message || 'Erro ao buscar imagem' });
    }
  },

  // Upload de imagem
  upload: async (req: Request, res: Response) => {
    try {
      const { chamado_id } = req.body;

      // Validações
      if (!chamado_id || isNaN(Number(chamado_id))) {
        return res.status(400).json({
          error: 'chamado_id é obrigatório e deve ser um número válido'
        });
      }

      // Verificar se o chamado existe
      const { data: chamadoExistente, error: chamadoError } = await supabase
        .from(TABELAS.CHAMADO)
        .select('id')
        .eq('id', chamado_id)
        .single();

      if (chamadoError || !chamadoExistente) {
        return res.status(400).json({
          error: 'Chamado não encontrado'
        });
      }

      // Verificar se há arquivo no request
      if (!req.file) {
        return res.status(400).json({
          error: 'Nenhum arquivo enviado. Use multipart/form-data com campo "file"'
        });
      }

      const file = req.file;
      const timestamp = Date.now();
      const fileName = `${chamado_id}/${timestamp}_${file.originalname}`;

      // Upload para S3
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

      // Salvar registro no banco de dados
      const { data: imagem, error: dbError } = await supabase
        .from(TABELAS.IMAGENS)
        .insert({
          path: fileName,
          bucket: BUCKET_NAME,
          chamado_id: Number(chamado_id)
        })
        .select('*')
        .single();

      if (dbError) {
        // Se falhar ao salvar no banco, tentar remover o arquivo do S3
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName
          });
          await s3Client.send(deleteCommand);
        } catch (deleteError) {
          console.error('Erro ao remover arquivo do S3 após falha no banco:', deleteError);
        }
        throw dbError;
      }

      // Gerar URL assinada para retornar
      const getObjectCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName
      });

      const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });

      return res.status(201).json({
        ...imagem,
        url,
        tamanho: file.size,
        tipo: file.mimetype,
        nome_original: file.originalname
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      return res.status(500).json({ error: error.message || 'Erro ao fazer upload da imagem' });
    }
  },

  // Download de imagem (retorna URL assinada)
  download: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      // Buscar imagem no banco
      const { data: imagem, error } = await supabase
        .from(TABELAS.IMAGENS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!imagem) {
        return res.status(404).json({ error: 'Imagem não encontrada' });
      }

      // Gerar URL assinada para download (válida por 1 hora)
      const getObjectCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imagem.path
      });

      const url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });

      return res.json({
        id: imagem.id,
        url,
        path: imagem.path,
        bucket: imagem.bucket,
        chamado_id: imagem.chamado_id,
        expires_in: 3600 // segundos
      });
    } catch (error: any) {
      console.error('Erro ao gerar URL de download:', error);
      return res.status(500).json({ error: error.message || 'Erro ao gerar URL de download' });
    }
  },

  // Remover imagem
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      // Buscar imagem no banco
      const { data: imagem, error: imagemError } = await supabase
        .from(TABELAS.IMAGENS)
        .select('*')
        .eq('id', id)
        .single();

      if (imagemError || !imagem) {
        return res.status(404).json({ error: 'Imagem não encontrada' });
      }

      // Remover arquivo do S3
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: imagem.path
        });
        await s3Client.send(deleteCommand);
      } catch (s3Error: any) {
        console.error('Erro ao remover arquivo do S3:', s3Error);
        // Continuar mesmo se falhar no S3 (pode já ter sido removido)
      }

      // Remover registro do banco
      const { error: deleteError } = await supabase
        .from(TABELAS.IMAGENS)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return res.json({ message: 'Imagem removida com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover imagem:', error);
      return res.status(500).json({ error: error.message || 'Erro ao remover imagem' });
    }
  }
};
