import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const chamadoController = {
  // Listar todos os chamados (com dados do usuário e filtros opcionais)
  getAll: async (req: Request, res: Response) => {
    try {
      const { status, usuario } = req.query;

      // Buscar chamados
      let query = supabase
        .from(TABELAS.CHAMADO)
        .select('*');

      // Aplicar filtros
      if (status) {
        query = query.eq('status', status);
      }

      if (usuario) {
        query = query.eq('usuario', usuario);
      }

      const { data: chamados, error } = await query.order('id', { ascending: false });

      if (error) throw error;

      // Buscar dados dos usuários
      const usuarioIds = chamados?.map((c: any) => c.usuario) || [];
      const usuariosUnicos = [...new Set(usuarioIds)];

      let usuariosMap = new Map();
      if (usuariosUnicos.length > 0) {
        const { data: usuarios, error: usuariosError } = await supabase
          .from(TABELAS.USUARIOS)
          .select('id, nome, tipo')
          .in('id', usuariosUnicos);

        if (!usuariosError && usuarios) {
          usuariosMap = new Map(usuarios.map((u: any) => [u.id, u]));
        }
      }

      // Combinar dados
      const chamadosComUsuario = chamados?.map((chamado: any) => ({
        ...chamado,
        usuario_dados: usuariosMap.get(chamado.usuario) || null
      })) || [];

      return res.json(chamadosComUsuario);
    } catch (error: any) {
      console.error('Erro ao listar chamados:', error);
      return res.status(500).json({ error: error.message || 'Erro ao listar chamados' });
    }
  },

  // Buscar chamado por id (com dados do usuário)
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const { data: chamado, error } = await supabase
        .from(TABELAS.CHAMADO)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      // Buscar dados do usuário
      const { data: usuario, error: usuarioError } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id, nome, tipo')
        .eq('id', chamado.usuario)
        .single();

      if (usuarioError) {
        console.error('Erro ao buscar usuário:', usuarioError);
      }

      return res.json({
        ...chamado,
        usuario_dados: usuario || null
      });
    } catch (error: any) {
      console.error('Erro ao buscar chamado:', error);
      return res.status(500).json({ error: error.message || 'Erro ao buscar chamado' });
    }
  },

  // Criar chamado
  create: async (req: Request, res: Response) => {
    try {
      const { titulo, usuario, status, descricao } = req.body;

      // Validações
      if (!titulo || !usuario || !status) {
        return res.status(400).json({
          error: 'titulo, usuario e status são obrigatórios'
        });
      }

      // Validar status
      const statusValidos = ['aberto', 'em_andamento', 'resolvido', 'cancelado'];
      if (!statusValidos.includes(status.toLowerCase())) {
        return res.status(400).json({
          error: `status deve ser um dos seguintes: ${statusValidos.join(', ')}`
        });
      }

      // Verificar se o usuário existe
      const { data: usuarioExistente, error: usuarioError } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id')
        .eq('id', usuario)
        .single();

      if (usuarioError || !usuarioExistente) {
        return res.status(400).json({
          error: 'Usuário não encontrado'
        });
      }

      // Criar chamado
      const { data, error } = await supabase
        .from(TABELAS.CHAMADO)
        .insert({
          titulo,
          usuario,
          status: status.toLowerCase(),
          descricao: descricao || null
        })
        .select('*')
        .single();

      if (error) throw error;

      // Buscar dados do usuário para retornar
      const { data: usuarioDados } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id, nome, tipo')
        .eq('id', usuario)
        .single();

      return res.status(201).json({
        ...data,
        usuario_dados: usuarioDados || null
      });
    } catch (error: any) {
      console.error('Erro ao criar chamado:', error);
      return res.status(500).json({ error: error.message || 'Erro ao criar chamado' });
    }
  },

  // Atualizar chamado
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { titulo, usuario, status, descricao } = req.body;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      // Verificar se o chamado existe e buscar dados atuais
      const { data: chamadoExistente, error: errorExistente } = await supabase
        .from(TABELAS.CHAMADO)
        .select('id, usuario')
        .eq('id', id)
        .single();

      if (errorExistente || !chamadoExistente) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      const updateData: any = {};

      if (titulo !== undefined) {
        if (!titulo || titulo.trim() === '') {
          return res.status(400).json({ error: 'titulo não pode ser vazio' });
        }
        updateData.titulo = titulo;
      }

      if (usuario !== undefined) {
        // Verificar se o usuário existe
        const { data: usuarioExistente, error: usuarioError } = await supabase
          .from(TABELAS.USUARIOS)
          .select('id')
          .eq('id', usuario)
          .single();

        if (usuarioError || !usuarioExistente) {
          return res.status(400).json({ error: 'Usuário não encontrado' });
        }
        updateData.usuario = usuario;
      }

      if (status !== undefined) {
        const statusValidos = ['aberto', 'em_andamento', 'resolvido', 'cancelado'];
        if (!statusValidos.includes(status.toLowerCase())) {
          return res.status(400).json({
            error: `status deve ser um dos seguintes: ${statusValidos.join(', ')}`
          });
        }
        updateData.status = status.toLowerCase();
      }

      if (descricao !== undefined) {
        updateData.descricao = descricao;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }

      const { data, error } = await supabase
        .from(TABELAS.CHAMADO)
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      // Buscar dados do usuário para retornar
      const usuarioId = updateData.usuario || chamadoExistente.usuario;
      const { data: usuarioDados } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id, nome, tipo')
        .eq('id', usuarioId)
        .single();

      return res.json({
        ...data,
        usuario_dados: usuarioDados || null
      });
    } catch (error: any) {
      console.error('Erro ao atualizar chamado:', error);
      return res.status(500).json({ error: error.message || 'Erro ao atualizar chamado' });
    }
  },

  // Remover chamado
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      // Verificar se o chamado existe
      const { data: chamadoExistente, error: errorExistente } = await supabase
        .from(TABELAS.CHAMADO)
        .select('id')
        .eq('id', id)
        .single();

      if (errorExistente || !chamadoExistente) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      const { error } = await supabase
        .from(TABELAS.CHAMADO)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ message: 'Chamado removido com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover chamado:', error);
      return res.status(500).json({ error: error.message || 'Erro ao remover chamado' });
    }
  },

  // Atualizar status do chamado (endpoint específico)
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      if (!status) {
        return res.status(400).json({ error: 'status é obrigatório' });
      }

      const statusValidos = ['aberto', 'em_andamento', 'resolvido', 'cancelado'];
      if (!statusValidos.includes(status.toLowerCase())) {
        return res.status(400).json({
          error: `status deve ser um dos seguintes: ${statusValidos.join(', ')}`
        });
      }

      // Verificar se o chamado existe
      const { data: chamadoExistente, error: errorExistente } = await supabase
        .from(TABELAS.CHAMADO)
        .select('id')
        .eq('id', id)
        .single();

      if (errorExistente || !chamadoExistente) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      const { data, error } = await supabase
        .from(TABELAS.CHAMADO)
        .update({ status: status.toLowerCase() })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      // Buscar dados do usuário para retornar
      const { data: usuarioDados } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id, nome, tipo')
        .eq('id', data.usuario)
        .single();

      return res.json({
        ...data,
        usuario_dados: usuarioDados || null
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status do chamado:', error);
      return res.status(500).json({ error: error.message || 'Erro ao atualizar status do chamado' });
    }
  }
};




