import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const produtoNovoController = {
  // Listar todos os produtos (com dados do fornecedor e locais)
  getAll: async (req: Request, res: Response) => {
    try {
      const { fornecedor_id } = req.query;

      let query = supabase
        .from(TABELAS.PRODUTOS)
        .select('*');

      if (fornecedor_id) {
        query = query.eq('fornecedor_id', fornecedor_id);
      }

      const { data, error } = await query.order('nome', { ascending: true });

      if (error) throw error;

      // Buscar dados relacionados para cada produto
      const produtosCompleto = await Promise.all(
        (data || []).map(async (produto: any) => {
          let fornecedor = null;
          let locais: any[] = [];

          // Buscar fornecedor
          if (produto.fornecedor_id) {
            try {
              const { data: fornecedorData } = await supabase
                .from(TABELAS.FORNECEDORES)
                .select('*')
                .eq('id', produto.fornecedor_id)
                .single();

              if (fornecedorData) fornecedor = fornecedorData;
            } catch (err) {
              console.error('Erro ao buscar fornecedor:', err);
            }
          }

          // Buscar locais relacionados
          try {
            const { data: produtoLocais } = await supabase
              .from(TABELAS.PRODUTO_LOCAIS)
              .select('local_id')
              .eq('produto_id', produto.id);

            if (produtoLocais && produtoLocais.length > 0) {
              const localIds = produtoLocais.map((pl: any) => pl.local_id);
              const { data: locaisData } = await supabase
                .from(TABELAS.LOCAIS)
                .select('*')
                .in('id', localIds);

              if (locaisData) locais = locaisData;
            }
          } catch (err) {
            console.error('Erro ao buscar locais:', err);
          }

          return {
            ...produto,
            fornecedor: fornecedor || null,
            locais: locais || []
          };
        })
      );

      return res.json(produtosCompleto);
    } catch (error: any) {
      console.error('Erro ao listar produtos:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar produto por id (com todos os dados relacionados)
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.PRODUTOS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Buscar fornecedor
      let fornecedor = null;
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

      // Buscar locais relacionados
      let locais: any[] = [];
      try {
        const { data: produtoLocais } = await supabase
          .from(TABELAS.PRODUTO_LOCAIS)
          .select('local_id')
          .eq('produto_id', id);

        if (produtoLocais && produtoLocais.length > 0) {
          const localIds = produtoLocais.map((pl: any) => pl.local_id);
          const { data: locaisData } = await supabase
            .from(TABELAS.LOCAIS)
            .select('*')
            .in('id', localIds);

          if (locaisData) locais = locaisData;
        }
      } catch (err) {
        console.error('Erro ao buscar locais:', err);
      }

      return res.json({
        ...data,
        fornecedor: fornecedor || null,
        locais: locais || []
      });
    } catch (error: any) {
      console.error('Erro ao buscar produto:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar produto
  create: async (req: Request, res: Response) => {
    try {
      const { fornecedor_id, nome, especificacao_tecnica, locais_ids } = req.body;

      if (!nome) {
        return res.status(400).json({
          error: 'nome é obrigatório'
        });
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
        .from(TABELAS.PRODUTOS)
        .insert({
          fornecedor_id: fornecedor_id || null,
          nome,
          especificacao_tecnica: especificacao_tecnica || null
        })
        .select()
        .single();

      if (error) throw error;

      // Associar locais se fornecidos
      if (locais_ids && Array.isArray(locais_ids) && locais_ids.length > 0) {
        const produtoLocais = locais_ids.map((local_id: number) => ({
          produto_id: data.id,
          local_id
        }));

        const { error: produtoLocaisError } = await supabase
          .from(TABELAS.PRODUTO_LOCAIS)
          .insert(produtoLocais);

        if (produtoLocaisError) {
          console.error('Erro ao associar locais:', produtoLocaisError);
        }
      }

      // Buscar fornecedor e locais para retornar
      let fornecedor = null;
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

      let locais: any[] = [];
      if (locais_ids && Array.isArray(locais_ids) && locais_ids.length > 0) {
        try {
          const { data: locaisData } = await supabase
            .from(TABELAS.LOCAIS)
            .select('*')
            .in('id', locais_ids);

          if (locaisData) locais = locaisData;
        } catch (err) {
          console.error('Erro ao buscar locais:', err);
        }
      }

      return res.status(201).json({
        ...data,
        fornecedor: fornecedor || null,
        locais: locais || []
      });
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar produto
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { fornecedor_id, nome, especificacao_tecnica, locais_ids, ...updateData } = req.body;

      // Validar fornecedor se fornecido
      if (fornecedor_id !== undefined) {
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
        updateData.fornecedor_id = fornecedor_id;
      }

      if (nome !== undefined) updateData.nome = nome;
      if (especificacao_tecnica !== undefined) updateData.especificacao_tecnica = especificacao_tecnica;

      const { data, error } = await supabase
        .from(TABELAS.PRODUTOS)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Atualizar locais se fornecidos
      if (locais_ids !== undefined && Array.isArray(locais_ids)) {
        // Remover associações antigas
        await supabase
          .from(TABELAS.PRODUTO_LOCAIS)
          .delete()
          .eq('produto_id', id);

        // Criar novas associações
        if (locais_ids.length > 0) {
          const produtoLocais = locais_ids.map((local_id: number) => ({
            produto_id: id,
            local_id
          }));

          await supabase
            .from(TABELAS.PRODUTO_LOCAIS)
            .insert(produtoLocais);
        }
      }

      // Buscar fornecedor e locais atualizados
      let fornecedor = null;
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

      let locais: any[] = [];
      try {
        const { data: produtoLocais } = await supabase
          .from(TABELAS.PRODUTO_LOCAIS)
          .select('local_id')
          .eq('produto_id', id);

        if (produtoLocais && produtoLocais.length > 0) {
          const localIds = produtoLocais.map((pl: any) => pl.local_id);
          const { data: locaisData } = await supabase
            .from(TABELAS.LOCAIS)
            .select('*')
            .in('id', localIds);

          if (locaisData) locais = locaisData;
        }
      } catch (err) {
        console.error('Erro ao buscar locais:', err);
      }

      return res.json({
        ...data,
        fornecedor: fornecedor || null,
        locais: locais || []
      });
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Remover produto
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Remover associações primeiro
      await supabase
        .from(TABELAS.PRODUTO_LOCAIS)
        .delete()
        .eq('produto_id', id);

      await supabase
        .from(TABELAS.FORNECEDOR_PRODUTOS)
        .delete()
        .eq('produto_id', id);

      const { error } = await supabase
        .from(TABELAS.PRODUTOS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ message: 'Produto removido com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover produto:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};
