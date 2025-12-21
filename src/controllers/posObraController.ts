import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const posObraController = {
  // Listar todas as pós-obras
  getAll: async (req: Request, res: Response) => {
    try {
      const { id_unidade, id_produto, status } = req.query;

      let query = supabase
        .from('pos_obra')
        .select('*');

      // Filtros opcionais
      if (id_unidade) {
        query = query.eq('id_unidade', id_unidade as string);
      }
      if (id_produto) {
        query = query.eq('id_produto', id_produto as string);
      }
      if (status) {
        query = query.eq('status', status as string);
      }

      const { data, error } = await query.order('data_instalacao', { ascending: false });

      if (error) throw error;

      // Buscar dados relacionados
      const produtosIds = [...new Set((data || []).map((item: any) => item.id_produto))];
      const unidadesIds = [...new Set((data || []).map((item: any) => item.id_unidade))];
      const garantiasIds = [...new Set((data || []).map((item: any) => item.id_garantia).filter(Boolean))];

      // Buscar produtos
      const { data: produtos, error: produtosError } = produtosIds.length > 0
        ? await supabase
            .from(TABELAS.PRODUTO)
            .select('*')
            .in('id', produtosIds)
        : { data: [], error: null };

      if (produtosError) throw produtosError;

      // Buscar unidades
      const { data: unidades, error: unidadesError } = unidadesIds.length > 0
        ? await supabase
            .from(TABELAS.UNIDADE)
            .select('*')
            .in('id', unidadesIds)
        : { data: [], error: null };

      if (unidadesError) throw unidadesError;

      // Buscar garantias
      const { data: garantias, error: garantiasError } = garantiasIds.length > 0
        ? await supabase
            .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
            .select('*')
            .in('id', garantiasIds)
        : { data: [], error: null };

      if (garantiasError) throw garantiasError;

      // Criar mapas para acesso rápido
      const produtosMap = new Map((produtos || []).map((p: any) => [p.id || p.id_produto, p]));
      const unidadesMap = new Map((unidades || []).map((u: any) => [u.id, u]));
      const garantiasMap = new Map((garantias || []).map((g: any) => [g.id || g.id_unidade_produto_garantia, g]));

      // Enriquecer dados
      const posObrasCompletas = (data || []).map((item: any) => {
        const produto = produtosMap.get(item.id_produto);
        const unidade = unidadesMap.get(item.id_unidade);
        const garantia = item.id_garantia ? garantiasMap.get(item.id_garantia) : null;

        // Normalizar ID
        const idNormalizado = item.id_pos_obra || item.id;

        return {
          ...item,
          id: idNormalizado,
          id_pos_obra: idNormalizado,
          Produto: produto,
          Unidade: unidade,
          Garantia: garantia
        };
      });

      res.json(posObrasCompletas);
    } catch (error: any) {
      console.error('Erro ao listar pós-obras:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Buscar pós-obra por ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Tentar buscar com diferentes nomes de coluna de ID
      let data = null;
      let error = null;

      const result1 = await supabase
        .from('pos_obra')
        .select('*')
        .eq('id_pos_obra', id)
        .single();

      if (result1.error) {
        const result2 = await supabase
          .from('pos_obra')
          .select('*')
          .eq('id', id)
          .single();

        if (result2.error) {
          error = result2.error;
        } else {
          data = result2.data;
        }
      } else {
        data = result1.data;
      }

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Pós-obra não encontrada' });
      }

      // Buscar dados relacionados
      const { data: produto } = await supabase
        .from(TABELAS.PRODUTO)
        .select('*')
        .eq('id', data.id_produto)
        .single();

      const { data: unidade } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*')
        .eq('id', data.id_unidade)
        .single();

      let garantia = null;
      if (data.id_garantia) {
        const { data: garantiaData } = await supabase
          .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
          .select('*')
          .eq('id', data.id_garantia)
          .single();
        garantia = garantiaData;
      }

      // Normalizar ID
      const idNormalizado = data.id_pos_obra || data.id;

      res.json({
        ...data,
        id: idNormalizado,
        id_pos_obra: idNormalizado,
        Produto: produto,
        Unidade: unidade,
        Garantia: garantia
      });
    } catch (error: any) {
      console.error('Erro ao buscar pós-obra:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Criar pós-obra
  create: async (req: Request, res: Response) => {
    try {
      const {
        id_produto,
        id_unidade,
        id_garantia,
        data_instalacao,
        data_conclusao,
        data_entrega,
        status,
        responsavel_instalacao,
        responsavel_obra,
        empresa_instaladora,
        observacoes,
        numero_nota_fiscal,
        numero_ordem_servico,
        foto_antes,
        foto_durante,
        foto_depois,
        documentos_anexos,
        aprovado_qualidade,
        data_aprovacao_qualidade,
        aprovado_por,
        garantia_iniciada,
        data_inicio_garantia
      } = req.body;

      if (!id_produto || !id_unidade || !data_instalacao) {
        return res.status(400).json({
          error: 'id_produto, id_unidade e data_instalacao são obrigatórios'
        });
      }

      // Verificar se produto existe
      const { data: produto, error: produtoError } = await supabase
        .from(TABELAS.PRODUTO)
        .select('*')
        .eq('id', id_produto)
        .single();

      if (produtoError) {
        // Tentar com id_produto
        const result2 = await supabase
          .from(TABELAS.PRODUTO)
          .select('*')
          .eq('id_produto', id_produto)
          .single();

        if (result2.error) {
          return res.status(404).json({ error: 'Produto não encontrado' });
        }
      }

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Verificar se unidade existe
      const { data: unidade, error: unidadeError } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*')
        .eq('id', id_unidade)
        .single();

      if (unidadeError) throw unidadeError;

      if (!unidade) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      // Verificar garantia se fornecida
      if (id_garantia) {
        const { data: garantia, error: garantiaError } = await supabase
          .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
          .select('*')
          .eq('id', id_garantia)
          .single();

        if (garantiaError) {
          return res.status(404).json({ error: 'Garantia não encontrada' });
        }
      }

      // Inserir pós-obra
      const { data: novaPosObra, error: insertError } = await supabase
        .from('pos_obra')
        .insert({
          id_produto,
          id_unidade,
          id_garantia: id_garantia || null,
          data_instalacao,
          data_conclusao: data_conclusao || null,
          data_entrega: data_entrega || null,
          status: status || 'PENDENTE',
          responsavel_instalacao: responsavel_instalacao || null,
          responsavel_obra: responsavel_obra || null,
          empresa_instaladora: empresa_instaladora || null,
          observacoes: observacoes || null,
          numero_nota_fiscal: numero_nota_fiscal || null,
          numero_ordem_servico: numero_ordem_servico || null,
          foto_antes: foto_antes || [],
          foto_durante: foto_durante || [],
          foto_depois: foto_depois || [],
          documentos_anexos: documentos_anexos || [],
          aprovado_qualidade: aprovado_qualidade || false,
          data_aprovacao_qualidade: data_aprovacao_qualidade || null,
          aprovado_por: aprovado_por || null,
          garantia_iniciada: garantia_iniciada || false,
          data_inicio_garantia: data_inicio_garantia || null
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      // Buscar dados relacionados para resposta
      const { data: produtoCompleto } = await supabase
        .from(TABELAS.PRODUTO)
        .select('*')
        .eq('id', id_produto)
        .single();

      const { data: unidadeCompleta } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*')
        .eq('id', id_unidade)
        .single();

      let garantiaCompleta = null;
      if (id_garantia) {
        const { data: garantiaData } = await supabase
          .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
          .select('*')
          .eq('id', id_garantia)
          .single();
        garantiaCompleta = garantiaData;
      }

      // Normalizar ID
      const idNormalizado = novaPosObra.id_pos_obra || novaPosObra.id;

      res.status(201).json({
        ...novaPosObra,
        id: idNormalizado,
        id_pos_obra: idNormalizado,
        Produto: produtoCompleto,
        Unidade: unidadeCompleta,
        Garantia: garantiaCompleta
      });
    } catch (error: any) {
      console.error('Erro ao criar pós-obra:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Atualizar pós-obra
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remover campos que não devem ser atualizados diretamente
      const { id: _, id_pos_obra: __, ...dataToUpdate } = updateData;

      // Buscar pós-obra existente
      let posObraExistente = null;
      let checkError = null;

      const check1 = await supabase
        .from('pos_obra')
        .select('*')
        .eq('id_pos_obra', id)
        .single();

      if (check1.error) {
        const check2 = await supabase
          .from('pos_obra')
          .select('*')
          .eq('id', id)
          .single();

        if (check2.error) {
          checkError = check2.error;
        } else {
          posObraExistente = check2.data;
        }
      } else {
        posObraExistente = check1.data;
      }

      if (checkError) throw checkError;

      if (!posObraExistente) {
        return res.status(404).json({ error: 'Pós-obra não encontrada' });
      }

      // Atualizar
      let data = null;
      let updateError = null;

      const update1 = await supabase
        .from('pos_obra')
        .update(dataToUpdate)
        .eq('id_pos_obra', id)
        .select('*')
        .single();

      if (update1.error) {
        const update2 = await supabase
          .from('pos_obra')
          .update(dataToUpdate)
          .eq('id', id)
          .select('*')
          .single();

        if (update2.error) {
          updateError = update2.error;
        } else {
          data = update2.data;
        }
      } else {
        data = update1.data;
      }

      if (updateError) {
        console.error('Erro ao atualizar pós-obra:', updateError);
        throw updateError;
      }

      if (!data) {
        return res.status(404).json({ error: 'Pós-obra não encontrada' });
      }

      // Buscar dados relacionados
      const { data: produto } = await supabase
        .from(TABELAS.PRODUTO)
        .select('*')
        .eq('id', data.id_produto)
        .single();

      const { data: unidade } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*')
        .eq('id', data.id_unidade)
        .single();

      let garantia = null;
      if (data.id_garantia) {
        const { data: garantiaData } = await supabase
          .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
          .select('*')
          .eq('id', data.id_garantia)
          .single();
        garantia = garantiaData;
      }

      // Normalizar ID
      const idNormalizado = data.id_pos_obra || data.id;

      res.json({
        ...data,
        id: idNormalizado,
        id_pos_obra: idNormalizado,
        Produto: produto,
        Unidade: unidade,
        Garantia: garantia
      });
    } catch (error: any) {
      console.error('Erro ao atualizar pós-obra:', error);
      res.status(500).json({
        error: error.message,
        details: error.details || 'Verifique se a tabela e colunas existem no banco de dados'
      });
    }
  },

  // Remover pós-obra
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID da pós-obra é obrigatório' });
      }

      console.log('🗑️ Tentando deletar pós-obra com ID:', id);

      // Tentar deletar usando 'id_pos_obra' primeiro
      let deleteError = null;
      let deletado = false;

      const delete1 = await supabase
        .from('pos_obra')
        .delete()
        .eq('id_pos_obra', id);

      if (delete1.error) {
        console.log('Tentativa com "id_pos_obra" falhou, tentando com "id"');
        const delete2 = await supabase
          .from('pos_obra')
          .delete()
          .eq('id', id);

        if (delete2.error) {
          deleteError = delete2.error;
          console.error('Erro ao deletar:', delete2.error);
        } else {
          deletado = true;
          console.log('✅ Pós-obra deletada usando id');
        }
      } else {
        deletado = true;
        console.log('✅ Pós-obra deletada usando id_pos_obra');
      }

      if (deleteError) {
        console.error('Erro ao deletar pós-obra:', deleteError);
        throw deleteError;
      }

      if (!deletado) {
        return res.status(404).json({ error: 'Pós-obra não encontrada' });
      }

      res.json({ message: 'Pós-obra removida com sucesso' });
    } catch (error: any) {
      console.error('Erro completo ao deletar:', error);
      res.status(500).json({
        error: error.message,
        details: error.details || 'Verifique se a tabela e colunas existem no banco de dados'
      });
    }
  }
};
