import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const contatoController = {
  // Listar contatos (com filtros opcionais)
  getAll: async (req: Request, res: Response) => {
    try {
      const { id_fornecedor, id_empreendimento } = req.query;

      let query = supabase.from(TABELAS.CONTATO).select('*');

      if (id_fornecedor) {
        query = query.eq('id_fornecedor', id_fornecedor);
      }

      if (id_empreendimento) {
        query = query.eq('id_empreendimento', id_empreendimento);
      }

      // Ordenar por ID (sempre existe) - remover ordenação por 'nome' que pode não existir
      const { data, error } = await query.order('id', { ascending: true });

      if (error) throw error;

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Criar contato
  create: async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from(TABELAS.CONTATO)
        .insert(req.body)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Atualizar contato
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.CONTATO)
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Contato não encontrado' });
      }

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Remover contato
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from(TABELAS.CONTATO)
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ message: 'Contato removido com sucesso' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};

