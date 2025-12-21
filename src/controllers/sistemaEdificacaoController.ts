import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const sistemaEdificacaoController = {
  // Listar todos os sistemas de edificação (com garantias relacionadas)
  getAll: async (req: Request, res: Response) => {
    try {
      const { exigencia } = req.query;

      let query = supabase
        .from(TABELAS.SISTEMAS_EDIFICACAO)
        .select('*');

      if (exigencia) {
        query = query.eq('exigencia', exigencia);
      }

      const { data, error } = await query.order('titulo', { ascending: true });

      if (error) throw error;

      // Buscar garantias relacionadas para cada sistema
      const sistemasCompleto = await Promise.all(
        (data || []).map(async (sistema: any) => {
          let garantias: any[] = [];

          try {
            const { data: sistemaGarantias } = await supabase
              .from(TABELAS.SISTEMA_GARANTIAS)
              .select('garantia_id')
              .eq('sistema_id', sistema.id);

            if (sistemaGarantias && sistemaGarantias.length > 0) {
              const garantiaIds = sistemaGarantias.map((sg: any) => sg.garantia_id);
              const { data: garantiasData } = await supabase
                .from(TABELAS.GARANTIAS)
                .select('*')
                .in('id', garantiaIds);

              if (garantiasData) garantias = garantiasData;
            }
          } catch (err) {
            console.error('Erro ao buscar garantias:', err);
          }

          return {
            ...sistema,
            garantias: garantias || []
          };
        })
      );

      return res.json(sistemasCompleto);
    } catch (error: any) {
      console.error('Erro ao listar sistemas de edificação:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar sistema por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.SISTEMAS_EDIFICACAO)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Sistema de edificação não encontrado' });
      }

      // Buscar garantias relacionadas
      let garantias: any[] = [];
      try {
        const { data: sistemaGarantias } = await supabase
          .from(TABELAS.SISTEMA_GARANTIAS)
          .select('garantia_id')
          .eq('sistema_id', id);

        if (sistemaGarantias && sistemaGarantias.length > 0) {
          const garantiaIds = sistemaGarantias.map((sg: any) => sg.garantia_id);
          const { data: garantiasData } = await supabase
            .from(TABELAS.GARANTIAS)
            .select('*')
            .in('id', garantiaIds);

          if (garantiasData) garantias = garantiasData;
        }
      } catch (err) {
        console.error('Erro ao buscar garantias:', err);
      }

      return res.json({
        ...data,
        garantias: garantias || []
      });
    } catch (error: any) {
      console.error('Erro ao buscar sistema de edificação:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar sistema de edificação
  create: async (req: Request, res: Response) => {
    try {
      const { titulo, norma, exigencia, cuidados_uso, garantias_ids } = req.body;

      if (!titulo) {
        return res.status(400).json({
          error: 'titulo é obrigatório'
        });
      }

      // Validar exigencia se fornecido
      if (exigencia) {
        const exigenciasValidas = ['obrigatoria', 'recomendada'];
        if (!exigenciasValidas.includes(exigencia.toLowerCase())) {
          return res.status(400).json({
            error: `exigencia deve ser um dos seguintes: ${exigenciasValidas.join(', ')}`
          });
        }
      }

      const { data, error } = await supabase
        .from(TABELAS.SISTEMAS_EDIFICACAO)
        .insert({
          titulo,
          norma: norma || null,
          exigencia: exigencia || null,
          cuidados_uso: cuidados_uso || null
        })
        .select()
        .single();

      if (error) throw error;

      // Associar garantias se fornecidas
      if (garantias_ids && Array.isArray(garantias_ids) && garantias_ids.length > 0) {
        const sistemaGarantias = garantias_ids.map((garantia_id: number) => ({
          sistema_id: data.id,
          garantia_id
        }));

        const { error: sistemaGarantiasError } = await supabase
          .from(TABELAS.SISTEMA_GARANTIAS)
          .insert(sistemaGarantias);

        if (sistemaGarantiasError) {
          console.error('Erro ao associar garantias:', sistemaGarantiasError);
        }
      }

      // Buscar garantias relacionadas
      let garantias: any[] = [];
      if (garantias_ids && Array.isArray(garantias_ids) && garantias_ids.length > 0) {
        try {
          const { data: garantiasData } = await supabase
            .from(TABELAS.GARANTIAS)
            .select('*')
            .in('id', garantias_ids);

          if (garantiasData) garantias = garantiasData;
        } catch (err) {
          console.error('Erro ao buscar garantias:', err);
        }
      }

      return res.status(201).json({
        ...data,
        garantias: garantias || []
      });
    } catch (error: any) {
      console.error('Erro ao criar sistema de edificação:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar sistema de edificação
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { garantias_ids, ...updateData } = req.body;

      // Validar exigencia se fornecido
      if (updateData.exigencia) {
        const exigenciasValidas = ['obrigatoria', 'recomendada'];
        if (!exigenciasValidas.includes(updateData.exigencia.toLowerCase())) {
          return res.status(400).json({
            error: `exigencia deve ser um dos seguintes: ${exigenciasValidas.join(', ')}`
          });
        }
      }

      const { data, error } = await supabase
        .from(TABELAS.SISTEMAS_EDIFICACAO)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Sistema de edificação não encontrado' });
      }

      // Atualizar garantias se fornecidas
      if (garantias_ids !== undefined && Array.isArray(garantias_ids)) {
        // Remover associações antigas
        await supabase
          .from(TABELAS.SISTEMA_GARANTIAS)
          .delete()
          .eq('sistema_id', id);

        // Criar novas associações
        if (garantias_ids.length > 0) {
          const sistemaGarantias = garantias_ids.map((garantia_id: number) => ({
            sistema_id: id,
            garantia_id
          }));

          await supabase
            .from(TABELAS.SISTEMA_GARANTIAS)
            .insert(sistemaGarantias);
        }
      }

      // Buscar garantias relacionadas
      let garantias: any[] = [];
      try {
        const { data: sistemaGarantias } = await supabase
          .from(TABELAS.SISTEMA_GARANTIAS)
          .select('garantia_id')
          .eq('sistema_id', id);

        if (sistemaGarantias && sistemaGarantias.length > 0) {
          const garantiaIds = sistemaGarantias.map((sg: any) => sg.garantia_id);
          const { data: garantiasData } = await supabase
            .from(TABELAS.GARANTIAS)
            .select('*')
            .in('id', garantiaIds);

          if (garantiasData) garantias = garantiasData;
        }
      } catch (err) {
        console.error('Erro ao buscar garantias:', err);
      }

      return res.json({
        ...data,
        garantias: garantias || []
      });
    } catch (error: any) {
      console.error('Erro ao atualizar sistema de edificação:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Remover sistema de edificação
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Remover associações primeiro
      await supabase
        .from(TABELAS.SISTEMA_GARANTIAS)
        .delete()
        .eq('sistema_id', id);

      const { error } = await supabase
        .from(TABELAS.SISTEMAS_EDIFICACAO)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ message: 'Sistema de edificação removido com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover sistema de edificação:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};



