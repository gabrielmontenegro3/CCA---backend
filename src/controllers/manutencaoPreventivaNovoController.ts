import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const manutencaoPreventivaNovoController = {
  // Listar todas as manutenções preventivas (com dados relacionados)
  getAll: async (req: Request, res: Response) => {
    try {
      const { local_id, produto_id } = req.query;

      let query = supabase
        .from(TABELAS.MANUTENCOES_PREVENTIVAS)
        .select('*');

      if (local_id) {
        query = query.eq('local_id', local_id);
      }

      if (produto_id) {
        query = query.eq('produto_id', produto_id);
      }

      const { data, error } = await query.order('id', { ascending: true });

      if (error) throw error;

      // Buscar dados relacionados para cada manutenção
      const manutencoesCompleto = await Promise.all(
        (data || []).map(async (manutencao: any) => {
          let local = null;
          let produto = null;

          if (manutencao.local_id) {
            try {
              const { data: localData } = await supabase
                .from(TABELAS.LOCAIS)
                .select('*')
                .eq('id', manutencao.local_id)
                .single();

              if (localData) local = localData;
            } catch (err) {
              console.error('Erro ao buscar local:', err);
            }
          }

          if (manutencao.produto_id) {
            try {
              const { data: produtoData } = await supabase
                .from(TABELAS.PRODUTOS)
                .select('*')
                .eq('id', manutencao.produto_id)
                .single();

              if (produtoData) produto = produtoData;
            } catch (err) {
              console.error('Erro ao buscar produto:', err);
            }
          }

          return {
            ...manutencao,
            local: local || null,
            produto: produto || null
          };
        })
      );

      return res.json(manutencoesCompleto);
    } catch (error: any) {
      console.error('Erro ao listar manutenções preventivas:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar manutenção preventiva por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.MANUTENCOES_PREVENTIVAS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Manutenção preventiva não encontrada' });
      }

      // Buscar dados relacionados
      let local = null;
      let produto = null;

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

      return res.json({
        ...data,
        local: local || null,
        produto: produto || null
      });
    } catch (error: any) {
      console.error('Erro ao buscar manutenção preventiva:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar manutenção preventiva
  create: async (req: Request, res: Response) => {
    try {
      const { local_id, produto_id, sistema_construtivo, arquivos } = req.body;

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

      const { data, error } = await supabase
        .from(TABELAS.MANUTENCOES_PREVENTIVAS)
        .insert({
          local_id: local_id || null,
          produto_id: produto_id || null,
          sistema_construtivo: sistema_construtivo || null,
          arquivos: arquivos || null
        })
        .select()
        .single();

      if (error) throw error;

      // Buscar dados relacionados
      let local = null;
      let produto = null;

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

      return res.status(201).json({
        ...data,
        local: local || null,
        produto: produto || null
      });
    } catch (error: any) {
      console.error('Erro ao criar manutenção preventiva:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar manutenção preventiva
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remover campos relacionados da atualização
      const { local: _, produto: __, ...dataToUpdate } = updateData;

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

      const { data, error } = await supabase
        .from(TABELAS.MANUTENCOES_PREVENTIVAS)
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Manutenção preventiva não encontrada' });
      }

      // Buscar dados relacionados
      let local = null;
      let produto = null;

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

      return res.json({
        ...data,
        local: local || null,
        produto: produto || null
      });
    } catch (error: any) {
      console.error('Erro ao atualizar manutenção preventiva:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Remover manutenção preventiva
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from(TABELAS.MANUTENCOES_PREVENTIVAS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ message: 'Manutenção preventiva removida com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover manutenção preventiva:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};
