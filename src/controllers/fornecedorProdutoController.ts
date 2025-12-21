import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const fornecedorProdutoController = {
  // Listar todas as associações fornecedor-produto
  getAll: async (req: Request, res: Response) => {
    try {
      const { fornecedor_id, produto_id } = req.query;

      let query = supabase
        .from(TABELAS.FORNECEDOR_PRODUTOS)
        .select('*');

      if (fornecedor_id) {
        query = query.eq('fornecedor_id', fornecedor_id);
      }

      if (produto_id) {
        query = query.eq('produto_id', produto_id);
      }

      const { data, error } = await query.order('fornecedor_id', { ascending: true });

      if (error) throw error;

      // Buscar dados relacionados
      const associacoesCompleto = await Promise.all(
        (data || []).map(async (associacao: any) => {
          let fornecedor = null;
          let produto = null;

          if (associacao.fornecedor_id) {
            try {
              const { data: fornecedorData } = await supabase
                .from(TABELAS.FORNECEDORES)
                .select('*')
                .eq('id', associacao.fornecedor_id)
                .single();

              if (fornecedorData) fornecedor = fornecedorData;
            } catch (err) {
              console.error('Erro ao buscar fornecedor:', err);
            }
          }

          if (associacao.produto_id) {
            try {
              const { data: produtoData } = await supabase
                .from(TABELAS.PRODUTOS)
                .select('*')
                .eq('id', associacao.produto_id)
                .single();

              if (produtoData) produto = produtoData;
            } catch (err) {
              console.error('Erro ao buscar produto:', err);
            }
          }

          return {
            ...associacao,
            fornecedor: fornecedor || null,
            produto: produto || null
          };
        })
      );

      return res.json(associacoesCompleto);
    } catch (error: any) {
      console.error('Erro ao listar associações fornecedor-produto:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar associação fornecedor-produto
  create: async (req: Request, res: Response) => {
    try {
      const { fornecedor_id, produto_id, especificacao_tecnica } = req.body;

      if (!fornecedor_id || !produto_id) {
        return res.status(400).json({
          error: 'fornecedor_id e produto_id são obrigatórios'
        });
      }

      // Validar se fornecedor existe
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

      // Validar se produto existe
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

      const { data, error } = await supabase
        .from(TABELAS.FORNECEDOR_PRODUTOS)
        .insert({
          fornecedor_id,
          produto_id,
          especificacao_tecnica: especificacao_tecnica || null
        })
        .select()
        .single();

      if (error) throw error;

      // Buscar dados relacionados
      let fornecedor = null;
      let produto = null;

      try {
        const { data: fornecedorData } = await supabase
          .from(TABELAS.FORNECEDORES)
          .select('*')
          .eq('id', fornecedor_id)
          .single();

        if (fornecedorData) fornecedor = fornecedorData;
      } catch (err) {
        console.error('Erro ao buscar fornecedor:', err);
      }

      try {
        const { data: produtoData } = await supabase
          .from(TABELAS.PRODUTOS)
          .select('*')
          .eq('id', produto_id)
          .single();

        if (produtoData) produto = produtoData;
      } catch (err) {
        console.error('Erro ao buscar produto:', err);
      }

      return res.status(201).json({
        ...data,
        fornecedor: fornecedor || null,
        produto: produto || null
      });
    } catch (error: any) {
      console.error('Erro ao criar associação fornecedor-produto:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar associação fornecedor-produto
  update: async (req: Request, res: Response) => {
    try {
      const { fornecedor_id, produto_id } = req.params;
      const { especificacao_tecnica } = req.body;

      const { data, error } = await supabase
        .from(TABELAS.FORNECEDOR_PRODUTOS)
        .update({
          especificacao_tecnica: especificacao_tecnica || null
        })
        .eq('fornecedor_id', fornecedor_id)
        .eq('produto_id', produto_id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Associação não encontrada' });
      }

      // Buscar dados relacionados
      let fornecedor = null;
      let produto = null;

      try {
        const { data: fornecedorData } = await supabase
          .from(TABELAS.FORNECEDORES)
          .select('*')
          .eq('id', fornecedor_id)
          .single();

        if (fornecedorData) fornecedor = fornecedorData;
      } catch (err) {
        console.error('Erro ao buscar fornecedor:', err);
      }

      try {
        const { data: produtoData } = await supabase
          .from(TABELAS.PRODUTOS)
          .select('*')
          .eq('id', produto_id)
          .single();

        if (produtoData) produto = produtoData;
      } catch (err) {
        console.error('Erro ao buscar produto:', err);
      }

      return res.json({
        ...data,
        fornecedor: fornecedor || null,
        produto: produto || null
      });
    } catch (error: any) {
      console.error('Erro ao atualizar associação fornecedor-produto:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Remover associação fornecedor-produto
  delete: async (req: Request, res: Response) => {
    try {
      const { fornecedor_id, produto_id } = req.params;

      const { error } = await supabase
        .from(TABELAS.FORNECEDOR_PRODUTOS)
        .delete()
        .eq('fornecedor_id', fornecedor_id)
        .eq('produto_id', produto_id);

      if (error) throw error;

      return res.json({ message: 'Associação removida com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover associação fornecedor-produto:', error);
      return res.status(500).json({ error: error.message });
    }
  }
};
