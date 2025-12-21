import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const garantiaNovoController = {
  // Listar todas as garantias (com dados relacionados)
  getAll: async (req: Request, res: Response) => {
    try {
      const { produto_id, local_id, fornecedor_id } = req.query;

      let query = supabase
        .from(TABELAS.GARANTIAS)
        .select('*');

      if (produto_id) {
        query = query.eq('produto_id', produto_id);
      }

      if (local_id) {
        query = query.eq('local_id', local_id);
      }

      if (fornecedor_id) {
        query = query.eq('fornecedor_id', fornecedor_id);
      }

      const { data, error } = await query.order('data_expiracao', { ascending: true });

      if (error) throw error;

      // Buscar dados relacionados para cada garantia
      const garantiasCompleto = await Promise.all(
        (data || []).map(async (garantia: any) => {
          let produto = null;
          let local = null;
          let fornecedor = null;

          if (garantia.produto_id) {
            try {
              const { data: produtoData } = await supabase
                .from(TABELAS.PRODUTOS)
                .select('*')
                .eq('id', garantia.produto_id)
                .single();

              if (produtoData) produto = produtoData;
            } catch (err) {
              console.error('Erro ao buscar produto:', err);
            }
          }

          if (garantia.local_id) {
            try {
              const { data: localData } = await supabase
                .from(TABELAS.LOCAIS)
                .select('*')
                .eq('id', garantia.local_id)
                .single();

              if (localData) local = localData;
            } catch (err) {
              console.error('Erro ao buscar local:', err);
            }
          }

          if (garantia.fornecedor_id) {
            try {
              const { data: fornecedorData } = await supabase
                .from(TABELAS.FORNECEDORES)
                .select('*')
                .eq('id', garantia.fornecedor_id)
                .single();

              if (fornecedorData) fornecedor = fornecedorData;
            } catch (err) {
              console.error('Erro ao buscar fornecedor:', err);
            }
          }

          return {
            ...garantia,
            produto: produto || null,
            local: local || null,
            fornecedor: fornecedor || null
          };
        })
      );

      return res.json(garantiasCompleto);
    } catch (error: any) {
      console.error('Erro ao listar garantias:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar garantia por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.GARANTIAS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Garantia não encontrada' });
      }

      // Buscar dados relacionados
      let produto = null;
      let local = null;
      let fornecedor = null;

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

      if (data.fornecedor_id) {
        try {
          const { data: fornecedorData } = await supabase
            .from(TABELAS.FORNECEDORES)
            .select('*')
            .eq('id', data.fornecedor_id)
            .single();

          if (fornecedorData) fornecedor = fornecedorData;
        } catch (err) {
          console.error('Erro ao buscar fornecedor:', err);
        }
      }

      return res.json({
        ...data,
        produto: produto || null,
        local: local || null,
        fornecedor: fornecedor || null
      });
    } catch (error: any) {
      console.error('Erro ao buscar garantia:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar garantia
  create: async (req: Request, res: Response) => {
    try {
      const {
        produto_id,
        local_id,
        fornecedor_id,
        duracao,
        cobertura,
        documentos,
        descricao,
        perda_garantia,
        data_compra,
        data_expiracao
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

      // Validar fornecedor se fornecido
      if (fornecedor_id) {
        const { error: fornecedorError } = await supabase
          .from(TABELAS.FORNECEDORES)
          .select('id')
          .eq('id', fornecedor_id)
          .single();

        if (fornecedorError) {
          return res.status(400).json({
            error: `Fornecedor com ID ${fornecedor_id} não encontrado`
          });
        }
      }

      const { data, error } = await supabase
        .from(TABELAS.GARANTIAS)
        .insert({
          produto_id: produto_id || null,
          local_id: local_id || null,
          fornecedor_id: fornecedor_id || null,
          duracao: duracao || null,
          cobertura: cobertura || null,
          documentos: documentos || null,
          descricao: descricao || null,
          perda_garantia: perda_garantia || null,
          data_compra: data_compra || null,
          data_expiracao: data_expiracao || null
        })
        .select()
        .single();

      if (error) throw error;

      // Buscar dados relacionados
      let produto = null;
      let local = null;
      let fornecedor = null;

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

      if (data.fornecedor_id) {
        try {
          const { data: fornecedorData } = await supabase
            .from(TABELAS.FORNECEDORES)
            .select('*')
            .eq('id', data.fornecedor_id)
            .single();

          if (fornecedorData) fornecedor = fornecedorData;
        } catch (err) {
          console.error('Erro ao buscar fornecedor:', err);
        }
      }

      return res.status(201).json({
        ...data,
        produto: produto || null,
        local: local || null,
        fornecedor: fornecedor || null
      });
    } catch (error: any) {
      console.error('Erro ao criar garantia:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar garantia
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remover campos relacionados da atualização
      const { produto: _, local: __, fornecedor: ___, ...dataToUpdate } = updateData;

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

      // Validar fornecedor se fornecido
      if (dataToUpdate.fornecedor_id) {
        const { error: fornecedorError } = await supabase
          .from(TABELAS.FORNECEDORES)
          .select('id')
          .eq('id', dataToUpdate.fornecedor_id)
          .single();

        if (fornecedorError) {
          return res.status(400).json({
            error: `Fornecedor com ID ${dataToUpdate.fornecedor_id} não encontrado`
          });
        }
      }

      const { data, error } = await supabase
        .from(TABELAS.GARANTIAS)
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Garantia não encontrada' });
      }

      // Buscar dados relacionados
      let produto = null;
      let local = null;
      let fornecedor = null;

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

      if (data.fornecedor_id) {
        try {
          const { data: fornecedorData } = await supabase
            .from(TABELAS.FORNECEDORES)
            .select('*')
            .eq('id', data.fornecedor_id)
            .single();

          if (fornecedorData) fornecedor = fornecedorData;
        } catch (err) {
          console.error('Erro ao buscar fornecedor:', err);
        }
      }

      return res.json({
        ...data,
        produto: produto || null,
        local: local || null,
        fornecedor: fornecedor || null
      });
    } catch (error: any) {
      console.error('Erro ao atualizar garantia:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Remover garantia
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from(TABELAS.GARANTIAS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ message: 'Garantia removida com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover garantia:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};



