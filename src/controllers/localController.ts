import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const localController = {
  // Listar todos os locais
  getAll: async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from(TABELAS.LOCAIS)
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      return res.json(data || []);
    } catch (error: any) {
      console.error('Erro ao listar locais:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar local por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.LOCAIS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Local não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar local:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar local
  create: async (req: Request, res: Response) => {
    try {
      const { nome, plano_preventivo } = req.body;

      if (!nome) {
        return res.status(400).json({
          error: 'nome é obrigatório'
        });
      }

      const { data, error } = await supabase
        .from(TABELAS.LOCAIS)
        .insert({
          nome,
          plano_preventivo: plano_preventivo || null
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    } catch (error: any) {
      console.error('Erro ao criar local:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar local
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Verificar se está tentando atualizar o ID (não permitido)
      if (updateData.id !== undefined) {
        return res.status(400).json({ 
          error: 'Não é permitido atualizar o ID do local' 
        });
      }

      // Verificar se o local existe
      const { data: localExistente, error: errorExistente } = await supabase
        .from(TABELAS.LOCAIS)
        .select('id')
        .eq('id', id)
        .single();

      if (errorExistente || !localExistente) {
        return res.status(404).json({ error: 'Local não encontrado' });
      }

      const { data, error } = await supabase
        .from(TABELAS.LOCAIS)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Verificar se é erro de chave estrangeira
        if (error.message && error.message.includes('foreign key constraint')) {
          return res.status(400).json({ 
            error: 'Não é possível atualizar este local pois ele está sendo utilizado por produtos',
            details: 'Remova as associações com produtos antes de atualizar'
          });
        }
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: 'Local não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      console.error('Erro ao atualizar local:', error);
      return res.status(500).json({ error: error.message || 'Erro ao atualizar local' });
    }
  },

  // Remover local
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar se o local existe
      const { data: localExistente, error: errorExistente } = await supabase
        .from(TABELAS.LOCAIS)
        .select('id, nome')
        .eq('id', id)
        .single();

      if (errorExistente || !localExistente) {
        return res.status(404).json({ error: 'Local não encontrado' });
      }

      // Verificar se existem produtos associados a este local
      const { data: produtoLocais, error: errorProdutoLocais } = await supabase
        .from(TABELAS.PRODUTO_LOCAIS)
        .select('produto_id')
        .eq('local_id', id);

      if (errorProdutoLocais) {
        console.error('Erro ao verificar dependências:', errorProdutoLocais);
        // Continuar mesmo com erro na verificação
      }

      // Se houver produtos associados, retornar erro informativo
      if (produtoLocais && produtoLocais.length > 0) {
        // Buscar nomes dos produtos para mensagem mais clara
        const produtoIds = produtoLocais.map((pl: any) => pl.produto_id);
        const { data: produtos } = await supabase
          .from(TABELAS.PRODUTOS)
          .select('id, nome')
          .in('id', produtoIds);

        const nomesProdutos = produtos?.map((p: any) => p.nome) || [];

        return res.status(400).json({
          error: 'Não é possível remover este local pois ele está associado a produtos',
          details: {
            local: localExistente.nome,
            produtos_associados: nomesProdutos,
            quantidade: produtoLocais.length
          },
          solucao: 'Remova as associações entre os produtos e este local antes de deletá-lo'
        });
      }

      // Se não houver dependências, deletar o local
      const { error } = await supabase
        .from(TABELAS.LOCAIS)
        .delete()
        .eq('id', id);

      if (error) {
        // Verificar se é erro de chave estrangeira
        if (error.message && error.message.includes('foreign key constraint')) {
          return res.status(400).json({ 
            error: 'Não é possível remover este local pois ele está sendo utilizado',
            details: 'Este local está associado a produtos ou outras entidades'
          });
        }
        throw error;
      }

      return res.json({ message: 'Local removido com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover local:', error);
      return res.status(500).json({ error: error.message || 'Erro ao remover local' });
    }
  }
};



