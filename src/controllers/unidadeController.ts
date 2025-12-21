import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const unidadeController = {
  // Listar unidades (com filtro opcional por empreendimento)
  getAll: async (req: Request, res: Response) => {
    try {
      const { id_empreendimento } = req.query;

      let query = supabase.from(TABELAS.UNIDADE).select('*');

      if (id_empreendimento) {
        query = query.eq('id_empreendimento', id_empreendimento);
      }

      // Ordenar por ID (sempre existe) - remover ordenação por 'numero' que não existe
      const { data, error } = await query.order('id', { ascending: true });

      if (error) throw error;

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Buscar unidade por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar unidade
  create: async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from(TABELAS.UNIDADE)
        .insert(req.body)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Atualizar unidade
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.UNIDADE)
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
};




