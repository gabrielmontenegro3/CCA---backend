import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const preventivoController = {
  // Listar todos os preventivos (com dados relacionados)
  getAll: async (req: Request, res: Response) => {
    try {
      const { produto_id, local_id, status } = req.query;

      let query = supabase
        .from(TABELAS.PREVENTIVOS)
        .select('*');

      if (produto_id) {
        query = query.eq('produto_id', produto_id);
      }

      if (local_id) {
        query = query.eq('local_id', local_id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('data_preventiva', { ascending: true });

      if (error) throw error;

      // Buscar dados relacionados para cada preventivo
      const preventivosCompleto = await Promise.all(
        (data || []).map(async (preventivo: any) => {
          let produto = null;
          let local = null;
          let arquivos: any[] = [];

          if (preventivo.produto_id) {
            try {
              const { data: produtoData } = await supabase
                .from(TABELAS.PRODUTOS)
                .select('*')
                .eq('id', preventivo.produto_id)
                .single();

              if (produtoData) produto = produtoData;
            } catch (err) {
              console.error('Erro ao buscar produto:', err);
            }
          }

          if (preventivo.local_id) {
            try {
              const { data: localData } = await supabase
                .from(TABELAS.LOCAIS)
                .select('*')
                .eq('id', preventivo.local_id)
                .single();

              if (localData) local = localData;
            } catch (err) {
              console.error('Erro ao buscar local:', err);
            }
          }

          // Buscar arquivos do preventivo
          try {
            const { data: arquivosData } = await supabase
              .from(TABELAS.PREVENTIVO_ARQUIVOS)
              .select('*')
              .eq('preventivo_id', preventivo.id)
              .order('id', { ascending: true });

            if (arquivosData) arquivos = arquivosData;
          } catch (err) {
            console.error('Erro ao buscar arquivos:', err);
          }

          return {
            ...preventivo,
            produto: produto || null,
            local: local || null,
            arquivos: arquivos || []
          };
        })
      );

      return res.json(preventivosCompleto);
    } catch (error: any) {
      console.error('Erro ao listar preventivos:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar preventivo por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.PREVENTIVOS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Preventivo não encontrado' });
      }

      // Buscar dados relacionados
      let produto = null;
      let local = null;
      let arquivos: any[] = [];

      if (data.produto_id) {
        try {
          const { data: produtoData } = await supabase
            .from(TABELAS.PRODUTOS)
            .select('*')
            .eq('id', data.produto_id)
            .single();

          if (produtoData) produto = produtoData;
        } catch (err) {
          console.error('Erro ao buscar produto:', err);
        }
      }

      if (data.local_id) {
        try {
          const { data: localData } = await supabase
            .from(TABELAS.LOCAIS)
            .select('*')
            .eq('id', data.local_id)
            .single();

          if (localData) local = localData;
        } catch (err) {
          console.error('Erro ao buscar local:', err);
        }
      }

      // Buscar arquivos
      try {
        const { data: arquivosData } = await supabase
          .from(TABELAS.PREVENTIVO_ARQUIVOS)
          .select('*')
          .eq('preventivo_id', id)
          .order('id', { ascending: true });

        if (arquivosData) arquivos = arquivosData;
      } catch (err) {
        console.error('Erro ao buscar arquivos:', err);
      }

      return res.json({
        ...data,
        produto: produto || null,
        local: local || null,
        arquivos: arquivos || []
      });
    } catch (error: any) {
      console.error('Erro ao buscar preventivo:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar preventivo
  create: async (req: Request, res: Response) => {
    try {
      const {
        produto_id,
        local_id,
        data_preventiva,
        periodicidade,
        status,
        empresa_responsavel,
        tecnico_responsavel,
        custo,
        anotacoes,
        exigencia
      } = req.body;

      // Validar produto se fornecido
      if (produto_id) {
        const { error: produtoError } = await supabase
          .from(TABELAS.PRODUTOS)
          .select('id')
          .eq('id', produto_id)
          .single();

        if (produtoError) {
          return res.status(400).json({
            error: `Produto com ID ${produto_id} não encontrado`
          });
        }
      }

      // Validar local se fornecido
      if (local_id) {
        const { error: localError } = await supabase
          .from(TABELAS.LOCAIS)
          .select('id')
          .eq('id', local_id)
          .single();

        if (localError) {
          return res.status(400).json({
            error: `Local com ID ${local_id} não encontrado`
          });
        }
      }

      // Validar exigencia se fornecido
      if (exigencia) {
        const exigenciasValidas = ['obrigatorio', 'recomendado'];
        if (!exigenciasValidas.includes(exigencia.toLowerCase())) {
          return res.status(400).json({
            error: `exigencia deve ser um dos seguintes: ${exigenciasValidas.join(', ')}`
          });
        }
      }

      const { data, error } = await supabase
        .from(TABELAS.PREVENTIVOS)
        .insert({
          produto_id: produto_id || null,
          local_id: local_id || null,
          data_preventiva: data_preventiva || null,
          periodicidade: periodicidade || null,
          status: status || null,
          empresa_responsavel: empresa_responsavel || null,
          tecnico_responsavel: tecnico_responsavel || null,
          custo: custo || null,
          anotacoes: anotacoes || null,
          exigencia: exigencia || null
        })
        .select()
        .single();

      if (error) throw error;

      // Buscar dados relacionados
      let produto = null;
      let local = null;

      if (data.produto_id) {
        try {
          const { data: produtoData } = await supabase
            .from(TABELAS.PRODUTOS)
            .select('*')
            .eq('id', data.produto_id)
            .single();

          if (produtoData) produto = produtoData;
        } catch (err) {
          console.error('Erro ao buscar produto:', err);
        }
      }

      if (data.local_id) {
        try {
          const { data: localData } = await supabase
            .from(TABELAS.LOCAIS)
            .select('*')
            .eq('id', data.local_id)
            .single();

          if (localData) local = localData;
        } catch (err) {
          console.error('Erro ao buscar local:', err);
        }
      }

      return res.status(201).json({
        ...data,
        produto: produto || null,
        local: local || null,
        arquivos: []
      });
    } catch (error: any) {
      console.error('Erro ao criar preventivo:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar preventivo
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remover campos relacionados da atualização
      const { produto: _, local: __, arquivos: ___, ...dataToUpdate } = updateData;

      // Validar produto se fornecido
      if (dataToUpdate.produto_id) {
        const { error: produtoError } = await supabase
          .from(TABELAS.PRODUTOS)
          .select('id')
          .eq('id', dataToUpdate.produto_id)
          .single();

        if (produtoError) {
          return res.status(400).json({
            error: `Produto com ID ${dataToUpdate.produto_id} não encontrado`
          });
        }
      }

      // Validar local se fornecido
      if (dataToUpdate.local_id) {
        const { error: localError } = await supabase
          .from(TABELAS.LOCAIS)
          .select('id')
          .eq('id', dataToUpdate.local_id)
          .single();

        if (localError) {
          return res.status(400).json({
            error: `Local com ID ${dataToUpdate.local_id} não encontrado`
          });
        }
      }

      // Validar exigencia se fornecido
      if (dataToUpdate.exigencia) {
        const exigenciasValidas = ['obrigatorio', 'recomendado'];
        if (!exigenciasValidas.includes(dataToUpdate.exigencia.toLowerCase())) {
          return res.status(400).json({
            error: `exigencia deve ser um dos seguintes: ${exigenciasValidas.join(', ')}`
          });
        }
      }

      const { data, error } = await supabase
        .from(TABELAS.PREVENTIVOS)
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Preventivo não encontrado' });
      }

      // Buscar dados relacionados
      let produto = null;
      let local = null;
      let arquivos: any[] = [];

      if (data.produto_id) {
        try {
          const { data: produtoData } = await supabase
            .from(TABELAS.PRODUTOS)
            .select('*')
            .eq('id', data.produto_id)
            .single();

          if (produtoData) produto = produtoData;
        } catch (err) {
          console.error('Erro ao buscar produto:', err);
        }
      }

      if (data.local_id) {
        try {
          const { data: localData } = await supabase
            .from(TABELAS.LOCAIS)
            .select('*')
            .eq('id', data.local_id)
            .single();

          if (localData) local = localData;
        } catch (err) {
          console.error('Erro ao buscar local:', err);
        }
      }

      // Buscar arquivos
      try {
        const { data: arquivosData } = await supabase
          .from(TABELAS.PREVENTIVO_ARQUIVOS)
          .select('*')
          .eq('preventivo_id', id)
          .order('id', { ascending: true });

        if (arquivosData) arquivos = arquivosData;
      } catch (err) {
        console.error('Erro ao buscar arquivos:', err);
      }

      return res.json({
        ...data,
        produto: produto || null,
        local: local || null,
        arquivos: arquivos || []
      });
    } catch (error: any) {
      console.error('Erro ao atualizar preventivo:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Remover preventivo
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Remover arquivos primeiro
      await supabase
        .from(TABELAS.PREVENTIVO_ARQUIVOS)
        .delete()
        .eq('preventivo_id', id);

      const { error } = await supabase
        .from(TABELAS.PREVENTIVOS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ message: 'Preventivo removido com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover preventivo:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};
