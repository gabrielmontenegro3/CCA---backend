import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

// Função auxiliar para calcular datas de garantia
const calcularGarantias = (
  dataBase: Date,
  prazoAbntMeses: number | null,
  prazoFabricaMeses: number | null
) => {
  const dataFimGarantiaAbnt = prazoAbntMeses
    ? new Date(dataBase)
    : null;
  if (dataFimGarantiaAbnt && prazoAbntMeses) {
    dataFimGarantiaAbnt.setMonth(dataFimGarantiaAbnt.getMonth() + prazoAbntMeses);
  }

  const dataFimGarantiaFabrica = prazoFabricaMeses
    ? new Date(dataBase)
    : null;
  if (dataFimGarantiaFabrica && prazoFabricaMeses) {
    dataFimGarantiaFabrica.setMonth(dataFimGarantiaFabrica.getMonth() + prazoFabricaMeses);
  }

  const hoje = new Date();

  const statusGarantiaAbnt = dataFimGarantiaAbnt
    ? hoje <= dataFimGarantiaAbnt
      ? 'VALIDA'
      : 'EXPIRADA'
    : null;

  const statusGarantiaFabrica = dataFimGarantiaFabrica
    ? hoje <= dataFimGarantiaFabrica
      ? 'VALIDA'
      : 'EXPIRADA'
    : null;

  return {
    data_fim_garantia_abnt: dataFimGarantiaAbnt?.toISOString().split('T')[0] || null,
    data_fim_garantia_fabrica: dataFimGarantiaFabrica?.toISOString().split('T')[0] || null,
    status_garantia_abnt: statusGarantiaAbnt,
    status_garantia_fabrica: statusGarantiaFabrica
  };
};

export const garantiaController = {
  // Listar todas as garantias
  getAll: async (req: Request, res: Response) => {
    try {
      const { id_unidade, id_produto } = req.query;

      let query = supabase
        .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
        .select('*');

      // Filtros opcionais
      if (id_unidade) {
        query = query.eq('id_unidade', id_unidade as string);
      }
      if (id_produto) {
        query = query.eq('id_produto', id_produto as string);
      }

      const { data, error } = await query.order('data_instalacao', { ascending: false });

      if (error) throw error;

      // Buscar dados relacionados (unidade, produto, empreendimento)
      const unidadesIds = [...new Set((data || []).map((item: any) => item.id_unidade))];
      const produtosIds = [...new Set((data || []).map((item: any) => item.id_produto))];

      // Buscar unidades
      const { data: unidades, error: unidadesError } = unidadesIds.length > 0
        ? await supabase
            .from(TABELAS.UNIDADE)
            .select('*')
            .in('id', unidadesIds)
        : { data: [], error: null };

      if (unidadesError) throw unidadesError;

      // Buscar produtos
      const { data: produtos, error: produtosError } = produtosIds.length > 0
        ? await supabase
            .from(TABELAS.PRODUTOS)
            .select('*')
            .in('id', produtosIds)
        : { data: [], error: null };

      if (produtosError) throw produtosError;

      // Buscar empreendimentos
      const empreendimentosIds = [...new Set((unidades || []).map((u: any) => u.id_empreendimento))];
      const { data: empreendimentos, error: empreendimentosError } = empreendimentosIds.length > 0
        ? await supabase
            .from(TABELAS.EMPREENDIMENTO)
            .select('*')
            .in('id', empreendimentosIds)
        : { data: [], error: null };

      if (empreendimentosError) throw empreendimentosError;

      // Criar mapas para acesso rápido
      const unidadesMap = new Map((unidades || []).map((u: any) => [u.id, u]));
      const produtosMap = new Map((produtos || []).map((p: any) => [p.id || p.id_produto, p]));
      const empreendimentosMap = new Map((empreendimentos || []).map((e: any) => [e.id, e]));

      // Enriquecer dados com cálculos de garantia
      const garantiasCompletas = (data || []).map((item: any) => {
        const unidade = unidadesMap.get(item.id_unidade);
        const produto = produtosMap.get(item.id_produto);
        const empreendimento = unidade ? empreendimentosMap.get(unidade.id_empreendimento) : null;

        // Determinar data_base
        const dataBase = item.data_instalacao
          ? new Date(item.data_instalacao)
          : unidade?.data_instalacao
          ? new Date(unidade.data_instalacao)
          : empreendimento?.data_entrega_chaves
          ? new Date(empreendimento.data_entrega_chaves)
          : new Date();

        // Calcular garantias
        const garantias = calcularGarantias(
          dataBase,
          produto?.prazo_garantia_abnt_meses || null,
          produto?.prazo_garantia_fabrica_meses || null
        );

        // Normalizar ID
        const idNormalizado = item.id || item.id_unidade_produto_garantia;

        return {
          ...item,
          id: idNormalizado,
          Unidade: unidade,
          Produto: produto,
          Empreendimento: empreendimento,
          data_base: dataBase.toISOString().split('T')[0],
          ...garantias
        };
      });

      res.json(garantiasCompletas);
    } catch (error: any) {
      console.error('Erro ao listar garantias:', error);
      res.status(500).json({ 
        error: error.message || 'Erro ao processar requisição',
        details: error.details || 'Verifique se as tabelas e colunas existem no banco de dados'
      });
    }
  },

  // Buscar garantia por ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Tentar buscar com diferentes nomes de coluna de ID
      let data = null;
      let error = null;

      const result1 = await supabase
        .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
        .select('*')
        .eq('id', id)
        .single();

      if (result1.error) {
        // Tentar com outros nomes possíveis
        const result2 = await supabase
          .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
          .select('*')
          .eq('id_unidade_produto_garantia', id)
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
        return res.status(404).json({ error: 'Garantia não encontrada' });
      }

      // Buscar dados relacionados
      const { data: unidade, error: unidadeError } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*')
        .eq('id', data.id_unidade)
        .single();

      if (unidadeError) throw unidadeError;

      const { data: produto, error: produtoError } = await supabase
        .from(TABELAS.PRODUTOS)
        .select('*')
        .eq('id', data.id_produto)
        .single();

      if (produtoError) throw produtoError;

      const { data: empreendimento, error: empreendimentoError } = await supabase
        .from(TABELAS.EMPREENDIMENTO)
        .select('*')
        .eq('id', unidade.id_empreendimento)
        .single();

      if (empreendimentoError) throw empreendimentoError;

      // Determinar data_base
      const dataBase = data.data_instalacao
        ? new Date(data.data_instalacao)
        : unidade?.data_instalacao
        ? new Date(unidade.data_instalacao)
        : empreendimento?.data_entrega_chaves
        ? new Date(empreendimento.data_entrega_chaves)
        : new Date();

      // Calcular garantias
      const garantias = calcularGarantias(
        dataBase,
        produto?.prazo_garantia_abnt_meses || null,
        produto?.prazo_garantia_fabrica_meses || null
      );

      // Normalizar ID
      const idNormalizado = data.id || data.id_unidade_produto_garantia;

      return res.json({
        ...data,
        id: idNormalizado,
        Unidade: unidade,
        Produto: produto,
        Empreendimento: empreendimento,
        data_base: dataBase.toISOString().split('T')[0],
        ...garantias
      });
    } catch (error: any) {
      console.error('Erro ao buscar garantia:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar garantia
  create: async (req: Request, res: Response) => {
    try {
      const { id_unidade, id_produto, data_instalacao, ...outrosCampos } = req.body;

      if (!id_unidade || !id_produto) {
        return res.status(400).json({ 
          error: 'id_unidade e id_produto são obrigatórios' 
        });
      }

      // Verificar se a unidade existe
      const { data: unidade, error: unidadeError } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*')
        .eq('id', id_unidade)
        .single();

      if (unidadeError) throw unidadeError;

      if (!unidade) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      // Buscar empreendimento
      const { data: empreendimento, error: empreendimentoError } = await supabase
        .from(TABELAS.EMPREENDIMENTO)
        .select('*')
        .eq('id', unidade.id_empreendimento)
        .single();

      if (empreendimentoError) throw empreendimentoError;

      // Verificar se o produto existe
      let produto = null;
      let produtoError = null;

      const result1 = await supabase
        .from(TABELAS.PRODUTOS)
        .select('*')
        .eq('id', id_produto)
        .single();

      if (result1.error) {
        // Tentar com id_produto
        const result2 = await supabase
          .from(TABELAS.PRODUTOS)
          .select('*')
          .eq('id_produto', id_produto)
          .single();

        if (result2.error) {
          produtoError = result2.error;
        } else {
          produto = result2.data;
        }
      } else {
        produto = result1.data;
      }

      if (produtoError) throw produtoError;

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Verificar se já existe garantia para esta unidade e produto
      const { data: garantiaExistente, error: checkError } = await supabase
        .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
        .select('*')
        .eq('id_unidade', id_unidade)
        .eq('id_produto', id_produto)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (garantiaExistente) {
        return res.status(409).json({ 
          error: 'Já existe uma garantia para esta unidade e produto' 
        });
      }

      // Determinar data_base
      const dataBase = data_instalacao
        ? new Date(data_instalacao)
        : unidade.data_instalacao
        ? new Date(unidade.data_instalacao)
        : empreendimento?.data_entrega_chaves
        ? new Date(empreendimento.data_entrega_chaves)
        : new Date();

      // Calcular garantias
      const garantias = calcularGarantias(
        dataBase,
        produto.prazo_garantia_abnt_meses || null,
        produto.prazo_garantia_fabrica_meses || null
      );

      // Inserir na tabela
      const { data: novaGarantia, error: insertError } = await supabase
        .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
        .insert({
          id_unidade,
          id_produto,
          data_instalacao: data_instalacao || unidade.data_instalacao || null,
          ...outrosCampos
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      // Normalizar ID
      const idNormalizado = novaGarantia.id || novaGarantia.id_unidade_produto_garantia;

      return res.status(201).json({
        ...novaGarantia,
        id: idNormalizado,
        Unidade: unidade,
        Produto: produto,
        Empreendimento: empreendimento,
        data_base: dataBase.toISOString().split('T')[0],
        ...garantias
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

      // Remover campos que não devem ser atualizados diretamente
      const { id: _, id_unidade, id_produto, ...dataToUpdate } = updateData;

      // Buscar garantia existente
      let garantiaExistente = null;
      let checkError = null;

      const check1 = await supabase
        .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
        .select('*')
        .eq('id', id)
        .single();

      if (check1.error) {
        const check2 = await supabase
          .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
          .select('*')
          .eq('id_unidade_produto_garantia', id)
          .single();

        if (check2.error) {
          checkError = check2.error;
        } else {
          garantiaExistente = check2.data;
        }
      } else {
        garantiaExistente = check1.data;
      }

      if (checkError) throw checkError;

      if (!garantiaExistente) {
        return res.status(404).json({ error: 'Garantia não encontrada' });
      }

      // Se data_instalacao foi alterada, recalcular garantias
      let garantiasCalculadas = {};
      if (dataToUpdate.data_instalacao !== undefined) {
        // Buscar unidade e produto para recalcular
        const { data: unidade } = await supabase
          .from(TABELAS.UNIDADE)
          .select('*')
          .eq('id', garantiaExistente.id_unidade)
          .single();

        const { data: produto } = await supabase
          .from(TABELAS.PRODUTOS)
          .select('*')
          .eq('id', garantiaExistente.id_produto)
          .single();

        if (unidade && produto) {
          const { data: empreendimento } = await supabase
            .from(TABELAS.EMPREENDIMENTO)
            .select('*')
            .eq('id', unidade.id_empreendimento)
            .single();

          const dataBase = dataToUpdate.data_instalacao
            ? new Date(dataToUpdate.data_instalacao)
            : unidade.data_instalacao
            ? new Date(unidade.data_instalacao)
            : empreendimento?.data_entrega_chaves
            ? new Date(empreendimento.data_entrega_chaves)
            : new Date();

          garantiasCalculadas = calcularGarantias(
            dataBase,
            produto.prazo_garantia_abnt_meses || null,
            produto.prazo_garantia_fabrica_meses || null
          );
        }
      }

      // Atualizar
      let data = null;
      let updateError = null;

      const update1 = await supabase
        .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
        .update(dataToUpdate)
        .eq('id', id)
        .select('*')
        .single();

      if (update1.error) {
        const update2 = await supabase
          .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
          .update(dataToUpdate)
          .eq('id_unidade_produto_garantia', id)
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
        console.error('Erro ao atualizar garantia:', updateError);
        throw updateError;
      }

      if (!data) {
        return res.status(404).json({ error: 'Garantia não encontrada' });
      }

      // Buscar dados relacionados
      const { data: unidade } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*')
        .eq('id', data.id_unidade)
        .single();

      const { data: produto } = await supabase
        .from(TABELAS.PRODUTOS)
        .select('*')
        .eq('id', data.id_produto)
        .single();

      const empreendimentoResult = unidade
        ? await supabase
            .from(TABELAS.EMPREENDIMENTO)
            .select('*')
            .eq('id', unidade.id_empreendimento)
            .single()
        : { data: null };
      const empreendimento = empreendimentoResult.data;

      // Determinar data_base
      const dataBase = data.data_instalacao
        ? new Date(data.data_instalacao)
        : unidade?.data_instalacao
        ? new Date(unidade.data_instalacao)
        : empreendimento?.data_entrega_chaves
        ? new Date(empreendimento.data_entrega_chaves)
        : new Date();

      // Calcular garantias (usar as calculadas se disponíveis)
      const garantias = Object.keys(garantiasCalculadas).length > 0
        ? garantiasCalculadas
        : calcularGarantias(
            dataBase,
            produto?.prazo_garantia_abnt_meses || null,
            produto?.prazo_garantia_fabrica_meses || null
          );

      // Normalizar ID
      const idNormalizado = data.id || data.id_unidade_produto_garantia;

      return res.json({
        ...data,
        id: idNormalizado,
        Unidade: unidade,
        Produto: produto,
        Empreendimento: empreendimento,
        data_base: dataBase.toISOString().split('T')[0],
        ...garantias
      });
    } catch (error: any) {
      console.error('Erro ao atualizar garantia:', error);
      return res.status(500).json({ 
        error: error.message,
        details: error.details || 'Verifique se a tabela e colunas existem no banco de dados'
      });
    }
  },

  // Remover garantia
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID da garantia é obrigatório' });
      }

      console.log('🗑️ Tentando deletar garantia com ID:', id);

      // Tentar deletar usando 'id' primeiro
      let deleteError = null;
      let deletado = false;

      const delete1 = await supabase
        .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
        .delete()
        .eq('id', id);

      if (delete1.error) {
        console.log('Tentativa com "id" falhou, tentando com "id_unidade_produto_garantia"');
        // Tentar com outro nome possível
        const delete2 = await supabase
          .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
          .delete()
          .eq('id_unidade_produto_garantia', id);

        if (delete2.error) {
          deleteError = delete2.error;
          console.error('Erro ao deletar com id_unidade_produto_garantia:', delete2.error);
        } else {
          deletado = true;
          console.log('✅ Garantia deletada usando id_unidade_produto_garantia');
        }
      } else {
        deletado = true;
        console.log('✅ Garantia deletada usando id');
      }

      if (deleteError) {
        console.error('Erro ao deletar garantia:', deleteError);
        throw deleteError;
      }

      if (!deletado) {
        return res.status(404).json({ error: 'Garantia não encontrada' });
      }

      return res.json({ message: 'Garantia removida com sucesso' });
    } catch (error: any) {
      console.error('Erro completo ao deletar:', error);
      return res.status(500).json({ 
        error: error.message,
        details: error.details || 'Verifique se a tabela e colunas existem no banco de dados'
      });
    }
  }
};



