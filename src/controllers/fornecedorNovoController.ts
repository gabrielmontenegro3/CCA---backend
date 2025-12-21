import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const fornecedorNovoController = {
  // Listar todos os fornecedores
  getAll: async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from(TABELAS.FORNECEDORES)
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      return res.json(data || []);
    } catch (error: any) {
      console.error('Erro ao listar fornecedores:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar fornecedor por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.FORNECEDORES)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar fornecedor:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar fornecedor
  create: async (req: Request, res: Response) => {
    try {
      const {
        nome,
        email,
        telefone,
        endereco,
        complemento,
        ponto_referencia,
        cidade,
        estado,
        cep
      } = req.body;

      if (!nome) {
        return res.status(400).json({
          error: 'nome é obrigatório'
        });
      }

      const { data, error } = await supabase
        .from(TABELAS.FORNECEDORES)
        .insert({
          nome,
          email: email || null,
          telefone: telefone || null,
          endereco: endereco || null,
          complemento: complemento || null,
          ponto_referencia: ponto_referencia || null,
          cidade: cidade || null,
          estado: estado || null,
          cep: cep || null
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar fornecedor
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const { data, error } = await supabase
        .from(TABELAS.FORNECEDORES)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      console.error('Erro ao atualizar fornecedor:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Remover fornecedor
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from(TABELAS.FORNECEDORES)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ message: 'Fornecedor removido com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover fornecedor:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};
