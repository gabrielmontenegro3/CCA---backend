import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const localController = {
  // Listar todos os locais
  getAll: async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from(TABELAS.LOCAIS)
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      return res.json(data || []);
    } catch (error: any) {
      console.error('Erro ao listar locais:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar local por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.LOCAIS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Local não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar local:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar local
  create: async (req: Request, res: Response) => {
    try {
      const { nome, plano_preventivo } = req.body;

      if (!nome) {
        return res.status(400).json({
          error: 'nome é obrigatório'
        });
      }

      const { data, error } = await supabase
        .from(TABELAS.LOCAIS)
        .insert({
          nome,
          plano_preventivo: plano_preventivo || null
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    } catch (error: any) {
      console.error('Erro ao criar local:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar local
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const { data, error } = await supabase
        .from(TABELAS.LOCAIS)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Local não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      console.error('Erro ao atualizar local:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Remover local
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from(TABELAS.LOCAIS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ message: 'Local removido com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover local:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};



