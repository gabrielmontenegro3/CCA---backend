import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

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

export const vistoriaLaudoMensagemController = {
  // 1️⃣ CRIAR MENSAGEM (com arquivos opcionais)
  create: async (req: Request, res: Response) => {
    try {
      const { vistoria_laudo_id } = req.params;
      const { mensagem } = req.body;
      const usuarioId = getUsuarioLogado(req);

      // Validações
      if (!vistoria_laudo_id) {
        return res.status(400).json({ error: 'vistoria_laudo_id é obrigatório' });
      }

      if (!mensagem || !mensagem.trim()) {
        return res.status(400).json({ error: 'mensagem é obrigatória' });
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

      // Criar mensagem
      const { data: novaMensagem, error: mensagemError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO_MENSAGEM)
        .insert({
          vistoria_laudo_id,
          usuario_id: usuarioId,
          mensagem: mensagem.trim()
        })
        .select('*')
        .single();

      if (mensagemError) {
        console.error('Erro ao criar mensagem:', mensagemError);
        throw mensagemError;
      }

      // Processar arquivos se houver
      const arquivos: any[] = [];
      let files: Express.Multer.File[] = [];

      if (req.files) {
        if (Array.isArray(req.files)) {
          files = req.files;
        } else if (typeof req.files === 'object') {
          files = Object.values(req.files).flat();
        }
      }

      // Se houver arquivos, fazer upload e vincular à mensagem
      if (files.length > 0) {
        const { uploadFilesVistoriaLaudo } = await import('../services/storageService');

        try {
          // Upload dos arquivos
          const uploadResults = await uploadFilesVistoriaLaudo(files, vistoria_laudo_id);

          // Criar registros de arquivos vinculados à mensagem
          for (let i = 0; i < uploadResults.length; i++) {
            const { data: arquivo, error: arquivoError } = await supabase
              .from(TABELAS.VISTORIA_LAUDO_ARQUIVO)
              .insert({
                vistoria_laudo_id,
                mensagem_id: novaMensagem.id,
                usuario_id: usuarioId,
                file_name: uploadResults[i].file_name,
                file_path: uploadResults[i].file_path,
                file_type: files[i].mimetype
              })
              .select('*')
              .single();

            if (!arquivoError && arquivo) {
              arquivos.push(arquivo);
            } else {
              console.error(`Erro ao criar registro de arquivo ${i}:`, arquivoError);
              // Tentar deletar o arquivo do storage se falhou ao criar registro
              const { deleteFileVistoriaLaudo } = await import('../services/storageService');
              await deleteFileVistoriaLaudo(uploadResults[i].file_path).catch(err =>
                console.error('Erro ao deletar arquivo órfão:', err)
              );
            }
          }
        } catch (uploadError: any) {
          console.error('Erro ao fazer upload de arquivos:', uploadError);
          // Se falhar o upload, deletar a mensagem criada para manter consistência
          await supabase
            .from(TABELAS.VISTORIA_LAUDO_MENSAGEM)
            .delete()
            .eq('id', novaMensagem.id);

          return res.status(500).json({
            error: 'Erro ao fazer upload de arquivos',
            message: uploadError.message || 'Erro desconhecido'
          });
        }
      }

      // Atualizar updated_at do laudo
      await supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', vistoria_laudo_id);

      // Retornar mensagem com arquivos
      return res.status(201).json({
        ...novaMensagem,
        arquivos
      });
    } catch (error: any) {
      console.error('Erro ao criar mensagem:', error);
      return res.status(500).json({
        error: 'Erro ao criar mensagem',
        message: error.message || 'Erro desconhecido'
      });
    }
  },

  // 2️⃣ LISTAR MENSAGENS DE UM LAUDO
  getByLaudoId: async (req: Request, res: Response) => {
    try {
      const { vistoria_laudo_id } = req.params;

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

      // Buscar mensagens (em ordem cronológica crescente)
      const { data: mensagens, error: mensagensError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO_MENSAGEM)
        .select('*')
        .eq('vistoria_laudo_id', vistoria_laudo_id)
        .order('created_at', { ascending: true });

      if (mensagensError) {
        console.error('Erro ao buscar mensagens:', mensagensError);
        throw mensagensError;
      }

      // Buscar arquivos para cada mensagem
      const mensagensComArquivos = await Promise.all(
        (mensagens || []).map(async (msg: any) => {
          const { data: arquivos } = await supabase
            .from(TABELAS.VISTORIA_LAUDO_ARQUIVO)
            .select('*')
            .eq('mensagem_id', msg.id)
            .order('created_at', { ascending: true });

          return {
            ...msg,
            arquivos: arquivos || []
          };
        })
      );

      return res.json(mensagensComArquivos);
    } catch (error: any) {
      console.error('Erro ao listar mensagens:', error);
      return res.status(500).json({ error: error.message || 'Erro ao listar mensagens' });
    }
  }
};

