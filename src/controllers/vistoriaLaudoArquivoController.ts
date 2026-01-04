import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';
import { uploadFilesVistoriaLaudo, getSignedUrlVistoriaLaudo, deleteFileVistoriaLaudo } from '../services/storageService';

// Helper para obter ID do usuário logado
function getUsuarioLogado(req: Request): number | null {
  const userIdHeader = req.headers['x-user-id'];
  if (userIdHeader) {
    const userId = Number(userIdHeader);
    if (!isNaN(userId)) return userId;
  }

  if (req.body.usuario_id) {
    const userId = Number(req.body.usuario_id);
    if (!isNaN(userId)) return userId;
  }

  return null;
}

export const vistoriaLaudoArquivoController = {
  // 1️⃣ UPLOAD DE ARQUIVOS DIRETAMENTE AO LAUDO (sem mensagem)
  upload: async (req: Request, res: Response) => {
    try {
      const { vistoria_laudo_id } = req.params;
      const usuarioId = getUsuarioLogado(req);

      // Validações
      if (!vistoria_laudo_id) {
        return res.status(400).json({ error: 'vistoria_laudo_id é obrigatório' });
      }

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuário não identificado. Envie x-user-id no header ou usuario_id no body' });
      }

      // Verificar se o laudo existe
      const { data: laudoExistente, error: laudoError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .select('id')
        .eq('id', vistoria_laudo_id)
        .single();

      if (laudoError || !laudoExistente) {
        return res.status(404).json({ error: 'Laudo não encontrado' });
      }

      // Verificar se o usuário existe
      const { data: usuarioExistente, error: usuarioError } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id')
        .eq('id', usuarioId)
        .single();

      if (usuarioError || !usuarioExistente) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Verificar se há arquivos
      let files: Express.Multer.File[] = [];
      if (req.files) {
        if (Array.isArray(req.files)) {
          files = req.files;
        } else if (typeof req.files === 'object') {
          files = Object.values(req.files).flat();
        }
      }

      if (files.length === 0) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      // Upload dos arquivos
      const uploadResults = await uploadFilesVistoriaLaudo(files, vistoria_laudo_id);

      // Criar registros de arquivos no banco
      const arquivosCriados: any[] = [];
      const erros: any[] = [];

      for (let i = 0; i < uploadResults.length; i++) {
        try {
          const { data: arquivo, error: arquivoError } = await supabase
            .from(TABELAS.VISTORIA_LAUDO_ARQUIVO)
            .insert({
              vistoria_laudo_id,
              mensagem_id: null, // Arquivo direto ao laudo, sem mensagem
              usuario_id: usuarioId,
              file_name: uploadResults[i].file_name,
              file_path: uploadResults[i].file_path,
              file_type: files[i].mimetype
            })
            .select('*')
            .single();

          if (!arquivoError && arquivo) {
            arquivosCriados.push(arquivo);
          } else {
            console.error(`Erro ao criar registro de arquivo ${i}:`, arquivoError);
            erros.push({
              file_name: uploadResults[i].file_name,
              error: arquivoError?.message || 'Erro desconhecido'
            });
            // Tentar deletar o arquivo do storage se falhou ao criar registro
            await deleteFileVistoriaLaudo(uploadResults[i].file_path).catch(err =>
              console.error('Erro ao deletar arquivo órfão:', err)
            );
          }
        } catch (err: any) {
          console.error(`Erro ao processar arquivo ${i}:`, err);
          erros.push({
            file_name: uploadResults[i].file_name,
            error: err.message || 'Erro desconhecido'
          });
          // Tentar deletar o arquivo do storage
          await deleteFileVistoriaLaudo(uploadResults[i].file_path).catch(deleteErr =>
            console.error('Erro ao deletar arquivo órfão:', deleteErr)
          );
        }
      }

      // Atualizar updated_at do laudo
      await supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', vistoria_laudo_id);

      if (erros.length > 0 && arquivosCriados.length === 0) {
        return res.status(500).json({
          error: 'Erro ao fazer upload de arquivos',
          erros
        });
      }

      return res.status(201).json({
        arquivos: arquivosCriados,
        erros: erros.length > 0 ? erros : undefined
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload de arquivos:', error);
      return res.status(500).json({
        error: 'Erro ao fazer upload de arquivos',
        message: error.message || 'Erro desconhecido'
      });
    }
  },

  // 2️⃣ LISTAR ARQUIVOS DE UM LAUDO
  getByLaudoId: async (req: Request, res: Response) => {
    try {
      const { vistoria_laudo_id } = req.params;
      const { mensagem_id } = req.query; // Opcional: filtrar por mensagem

      if (!vistoria_laudo_id) {
        return res.status(400).json({ error: 'vistoria_laudo_id é obrigatório' });
      }

      // Verificar se o laudo existe
      const { data: laudoExistente, error: laudoError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .select('id')
        .eq('id', vistoria_laudo_id)
        .single();

      if (laudoError || !laudoExistente) {
        return res.status(404).json({ error: 'Laudo não encontrado' });
      }

      let query = supabase
        .from(TABELAS.VISTORIA_LAUDO_ARQUIVO)
        .select('*')
        .eq('vistoria_laudo_id', vistoria_laudo_id);

      // Filtrar por mensagem_id se fornecido
      if (mensagem_id) {
        query = query.eq('mensagem_id', mensagem_id);
      } else {
        // Se não fornecido, buscar apenas arquivos sem mensagem (diretos ao laudo)
        query = query.is('mensagem_id', null);
      }

      const { data: arquivos, error: arquivosError } = await query.order('created_at', { ascending: true });

      if (arquivosError) {
        console.error('Erro ao buscar arquivos:', arquivosError);
        throw arquivosError;
      }

      // Gerar URLs assinadas para cada arquivo
      const arquivosComUrl = await Promise.all(
        (arquivos || []).map(async (arquivo: any) => {
          try {
            const url = await getSignedUrlVistoriaLaudo(arquivo.file_path, 3600); // URL válida por 1 hora
            return {
              ...arquivo,
              url
            };
          } catch (urlError) {
            console.error(`Erro ao gerar URL para arquivo ${arquivo.id}:`, urlError);
            return {
              ...arquivo,
              url: null,
              erro_url: 'Erro ao gerar URL'
            };
          }
        })
      );

      return res.json(arquivosComUrl);
    } catch (error: any) {
      console.error('Erro ao listar arquivos:', error);
      return res.status(500).json({ error: error.message || 'Erro ao listar arquivos' });
    }
  },

  // 3️⃣ OBTER URL DE DOWNLOAD DE UM ARQUIVO
  getDownloadUrl: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { expires_in } = req.query; // Opcional: tempo de expiração em segundos (padrão: 1 hora)

      if (!id) {
        return res.status(400).json({ error: 'ID do arquivo é obrigatório' });
      }

      // Buscar arquivo
      const { data: arquivo, error: arquivoError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO_ARQUIVO)
        .select('*')
        .eq('id', id)
        .single();

      if (arquivoError || !arquivo) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      // Gerar URL assinada
      const expiresIn = expires_in ? Number(expires_in) : 3600; // Padrão: 1 hora
      const url = await getSignedUrlVistoriaLaudo(arquivo.file_path, expiresIn);

      return res.json({
        id: arquivo.id,
        file_name: arquivo.file_name,
        file_type: arquivo.file_type,
        url,
        expires_in: expiresIn
      });
    } catch (error: any) {
      console.error('Erro ao gerar URL de download:', error);
      return res.status(500).json({ error: error.message || 'Erro ao gerar URL de download' });
    }
  },

  // 4️⃣ DELETAR ARQUIVO
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID do arquivo é obrigatório' });
      }

      // Buscar arquivo
      const { data: arquivo, error: arquivoError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO_ARQUIVO)
        .select('*')
        .eq('id', id)
        .single();

      if (arquivoError || !arquivo) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      // Deletar arquivo do storage
      try {
        await deleteFileVistoriaLaudo(arquivo.file_path);
      } catch (storageError: any) {
        console.error('Erro ao deletar arquivo do storage:', storageError);
        // Continuar mesmo se falhar (pode já ter sido deletado)
      }

      // Deletar registro do banco
      const { error: deleteError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO_ARQUIVO)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Atualizar updated_at do laudo
      await supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', arquivo.vistoria_laudo_id);

      return res.status(204).send();
    } catch (error: any) {
      console.error('Erro ao deletar arquivo:', error);
      return res.status(500).json({ error: error.message || 'Erro ao deletar arquivo' });
    }
  }
};

