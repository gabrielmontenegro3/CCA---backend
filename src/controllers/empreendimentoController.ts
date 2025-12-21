import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const empreendimentoController = {
  // Listar empreendimentos
  getAll: async (req: Request, res: Response) => {
    try {
      // Ordenar por ID (sempre existe) - remover ordenação por 'nome' que pode não existir
      const { data, error } = await supabase
        .from(TABELAS.EMPREENDIMENTO)
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Buscar empreendimento por id (com unidades e contato do síndico)
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Buscar empreendimento
      const { data: empreendimento, error: empreendimentoError } = await supabase
        .from(TABELAS.EMPREENDIMENTO)
        .select('*')
        .eq('id', id)
        .single();

      if (empreendimentoError) throw empreendimentoError;

      if (!empreendimento) {
        return res.status(404).json({ error: 'Empreendimento não encontrado' });
      }

      // Buscar unidades vinculadas
      const { data: unidades, error: unidadesError } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*')
        .eq('id_empreendimento', id);

      if (unidadesError) throw unidadesError;

      // Buscar contato do síndico
      const { data: contatoSindico, error: contatoError } = await supabase
        .from(TABELAS.CONTATO)
        .select('*')
        .eq('id_empreendimento', id)
        .eq('tipo', 'sindico')
        .maybeSingle();

      if (contatoError) throw contatoError;

      res.json({
        ...empreendimento,
        unidades: unidades || [],
        contato_sindico: contatoSindico || null
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Criar empreendimento
  create: async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from(TABELAS.EMPREENDIMENTO)
        .insert(req.body)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Atualizar empreendimento
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.EMPREENDIMENTO)
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Empreendimento não encontrado' });
      }

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};

