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

export const vistoriaLaudoController = {
  // 1️⃣ CRIAR LAUDO
  create: async (req: Request, res: Response) => {
    try {
      const { titulo, chamado_id } = req.body;
      const usuarioId = getUsuarioLogado(req);

      // Validações
      if (!titulo || !titulo.trim()) {
        return res.status(400).json({ error: 'titulo é obrigatório' });
      }

      if (!chamado_id || isNaN(Number(chamado_id))) {
        return res.status(400).json({ error: 'chamado_id é obrigatório e deve ser um número válido' });
      }

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuário não identificado. Envie x-user-id no header ou usuario_id no body' });
      }

      // Verificar se o chamado existe
      const { data: chamadoExistente, error: chamadoError } = await supabase
        .from(TABELAS.CHAMADO)
        .select('id')
        .eq('id', chamado_id)
        .single();

      if (chamadoError || !chamadoExistente) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
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

      // Criar laudo
      const { data: laudo, error: laudoError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .insert({
          titulo: titulo.trim(),
          chamado_id: Number(chamado_id),
          usuario_id: usuarioId
        })
        .select('*')
        .single();

      if (laudoError) {
        console.error('Erro ao criar laudo:', laudoError);
        throw laudoError;
      }

      return res.status(201).json(laudo);
    } catch (error: any) {
      console.error('Erro ao criar laudo:', error);
      return res.status(500).json({
        error: 'Erro ao criar laudo',
        message: error.message || 'Erro desconhecido'
      });
    }
  },

  // 2️⃣ LISTAR LAUDOS (com filtro opcional por chamado_id)
  getAll: async (req: Request, res: Response) => {
    try {
      const { chamado_id } = req.query;

      let query = supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .select('*');

      // Filtrar por chamado_id se fornecido
      if (chamado_id) {
        query = query.eq('chamado_id', chamado_id);
      }

      const { data: laudos, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return res.json(laudos || []);
    } catch (error: any) {
      console.error('Erro ao listar laudos:', error);
      return res.status(500).json({ error: error.message || 'Erro ao listar laudos' });
    }
  },

  // 3️⃣ DETALHAR LAUDO (com mensagens e arquivos)
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID do laudo é obrigatório' });
      }

      // Buscar laudo
      const { data: laudo, error: laudoError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .select('*')
        .eq('id', id)
        .single();

      if (laudoError || !laudo) {
        return res.status(404).json({ error: 'Laudo não encontrado' });
      }

      // Buscar mensagens (em ordem cronológica crescente)
      const { data: mensagens, error: mensagensError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO_MENSAGEM)
        .select('*')
        .eq('vistoria_laudo_id', id)
        .order('created_at', { ascending: true });

      if (mensagensError) {
        console.error('Erro ao buscar mensagens:', mensagensError);
        throw mensagensError;
      }

      // Buscar arquivos associados ao laudo (sem mensagem_id)
      const { data: arquivosLaudo, error: arquivosLaudoError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO_ARQUIVO)
        .select('*')
        .eq('vistoria_laudo_id', id)
        .is('mensagem_id', null)
        .order('created_at', { ascending: true });

      if (arquivosLaudoError) {
        console.error('Erro ao buscar arquivos do laudo:', arquivosLaudoError);
        throw arquivosLaudoError;
      }

      // Buscar arquivos associados a cada mensagem
      const mensagensComArquivos = await Promise.all(
        (mensagens || []).map(async (msg: any) => {
          const { data: arquivosMensagem } = await supabase
            .from(TABELAS.VISTORIA_LAUDO_ARQUIVO)
            .select('*')
            .eq('mensagem_id', msg.id)
            .order('created_at', { ascending: true });

          return {
            ...msg,
            arquivos: arquivosMensagem || []
          };
        })
      );

      return res.json({
        ...laudo,
        mensagens: mensagensComArquivos,
        arquivos: arquivosLaudo || []
      });
    } catch (error: any) {
      console.error('Erro ao buscar laudo:', error);
      return res.status(500).json({ error: error.message || 'Erro ao buscar laudo' });
    }
  },

  // 4️⃣ ATUALIZAR LAUDO
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { titulo } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID do laudo é obrigatório' });
      }

      // Verificar se o laudo existe
      const { data: laudoExistente, error: laudoError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .select('id')
        .eq('id', id)
        .single();

      if (laudoError || !laudoExistente) {
        return res.status(404).json({ error: 'Laudo não encontrado' });
      }

      // Preparar dados para atualização
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (titulo !== undefined) {
        if (!titulo || !titulo.trim()) {
          return res.status(400).json({ error: 'titulo não pode ser vazio' });
        }
        updateData.titulo = titulo.trim();
      }

      // Atualizar laudo
      const { data: laudoAtualizado, error: updateError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      return res.json(laudoAtualizado);
    } catch (error: any) {
      console.error('Erro ao atualizar laudo:', error);
      return res.status(500).json({ error: error.message || 'Erro ao atualizar laudo' });
    }
  },

  // 5️⃣ EXCLUIR LAUDO (cascade deleta mensagens e arquivos)
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID do laudo é obrigatório' });
      }

      // Verificar se o laudo existe
      const { data: laudoExistente, error: laudoError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .select('id')
        .eq('id', id)
        .single();

      if (laudoError || !laudoExistente) {
        return res.status(404).json({ error: 'Laudo não encontrado' });
      }

      // Buscar todos os arquivos do laudo para deletar do storage
      const { data: arquivos, error: arquivosError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO_ARQUIVO)
        .select('file_path')
        .eq('vistoria_laudo_id', id);

      if (arquivosError) {
        console.error('Erro ao buscar arquivos para exclusão:', arquivosError);
        // Continuar mesmo se houver erro ao buscar arquivos
      }

      // Deletar arquivos do storage (se houver)
      if (arquivos && arquivos.length > 0) {
        const { deleteFileVistoriaLaudo } = await import('../services/storageService');
        await Promise.all(
          arquivos.map(arquivo => 
            deleteFileVistoriaLaudo(arquivo.file_path).catch(err => 
              console.error(`Erro ao deletar arquivo ${arquivo.file_path}:`, err)
            )
          )
        );
      }

      // Deletar laudo (cascade deleta mensagens e registros de arquivos)
      const { error: deleteError } = await supabase
        .from(TABELAS.VISTORIA_LAUDO)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return res.status(204).send();
    } catch (error: any) {
      console.error('Erro ao excluir laudo:', error);
      return res.status(500).json({ error: error.message || 'Erro ao excluir laudo' });
    }
  }
};

