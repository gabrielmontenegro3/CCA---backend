import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const preventivoArquivoController = {
  // Listar todos os arquivos de preventivo
  getAll: async (req: Request, res: Response) => {
    try {
      const { preventivo_id, tipo } = req.query;

      let query = supabase
        .from(TABELAS.PREVENTIVO_ARQUIVOS)
        .select('*');

      if (preventivo_id) {
        query = query.eq('preventivo_id', preventivo_id);
      }

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query.order('id', { ascending: true });

      if (error) throw error;

      return res.json(data || []);
    } catch (error: any) {
      console.error('Erro ao listar arquivos de preventivo:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar arquivo por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.PREVENTIVO_ARQUIVOS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar arquivo:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar arquivo de preventivo
  create: async (req: Request, res: Response) => {
    try {
      const { preventivo_id, tipo, arquivo } = req.body;

      if (!preventivo_id || !tipo || !arquivo) {
        return res.status(400).json({
          error: 'preventivo_id, tipo e arquivo são obrigatórios'
        });
      }

      // Validar se preventivo existe
      const { error: preventivoError } = await supabase
        .from(TABELAS.PREVENTIVOS)
        .select('id')
        .eq('id', preventivo_id)
        .single();

      if (preventivoError) {
        return res.status(400).json({
          error: `Preventivo com ID ${preventivo_id} não encontrado`
        });
      }

      const { data, error } = await supabase
        .from(TABELAS.PREVENTIVO_ARQUIVOS)
        .insert({
          preventivo_id,
          tipo,
          arquivo
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    } catch (error: any) {
      console.error('Erro ao criar arquivo:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar arquivo
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validar preventivo se fornecido
      if (updateData.preventivo_id) {
        const { error: preventivoError } = await supabase
          .from(TABELAS.PREVENTIVOS)
          .select('id')
          .eq('id', updateData.preventivo_id)
          .single();

        if (preventivoError) {
          return res.status(400).json({
            error: `Preventivo com ID ${updateData.preventivo_id} não encontrado`
          });
        }
      }

      const { data, error } = await supabase
        .from(TABELAS.PREVENTIVO_ARQUIVOS)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      console.error('Erro ao atualizar arquivo:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Remover arquivo
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from(TABELAS.PREVENTIVO_ARQUIVOS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ message: 'Arquivo removido com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover arquivo:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};
