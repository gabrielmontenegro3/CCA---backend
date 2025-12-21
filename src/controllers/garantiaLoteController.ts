import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const garantiaLoteController = {
  // Listar todas as garantias de lote
  getAll: async (req: Request, res: Response) => {
    try {
      const { id_produto, id_fornecedor, id_contato } = req.query;

      let query = supabase
        .from('garantia_lote')
        .select('*');

      // Filtros opcionais
      if (id_produto) {
        query = query.eq('id_produto', id_produto as string);
      }
      if (id_fornecedor) {
        query = query.eq('id_fornecedor', id_fornecedor as string);
      }
      if (id_contato) {
        query = query.eq('id_contato', id_contato as string);
      }

      const { data, error } = await query.order('data_compra', { ascending: false });

      if (error) throw error;

      // Buscar dados relacionados
      const produtosIds = [...new Set((data || []).map((item: any) => item.id_produto).filter(Boolean))];
      const fornecedoresIds = [...new Set((data || []).map((item: any) => item.id_fornecedor).filter(Boolean))];
      const contatosIds = [...new Set((data || []).map((item: any) => item.id_contato).filter(Boolean))];

      // Buscar produtos
      let produtos: any[] = [];
      let produtosError = null;

      if (produtosIds.length > 0) {
        const result1 = await supabase
          .from(TABELAS.PRODUTOS)
          .select('*')
          .in('id', produtosIds);

        if (result1.error) {
          // Tentar com id_produto
          const result2 = await supabase
            .from(TABELAS.PRODUTOS)
            .select('*')
            .in('id_produto', produtosIds);
          
          if (result2.error) {
            produtosError = result2.error;
          } else {
            produtos = result2.data || [];
          }
        } else {
          produtos = result1.data || [];
        }
      }

      if (produtosError) throw produtosError;

      // Buscar fornecedores
      const { data: fornecedores, error: fornecedoresError } = fornecedoresIds.length > 0
        ? await supabase
            .from(TABELAS.FORNECEDORES)
            .select('*')
            .in('id', fornecedoresIds)
        : { data: [], error: null };

      if (fornecedoresError) throw fornecedoresError;

      // Buscar contatos
      const { data: contatos, error: contatosError } = contatosIds.length > 0
        ? await supabase
            .from(TABELAS.CONTATO)
            .select('*')
            .in('id', contatosIds)
        : { data: [], error: null };

      if (contatosError) throw contatosError;

      // Criar mapas para acesso rápido
      const produtosMap = new Map((produtos || []).map((p: any) => [p.id || p.id_produto, p]));
      const fornecedoresMap = new Map((fornecedores || []).map((f: any) => [f.id || f.id_fornecedor, f]));
      const contatosMap = new Map((contatos || []).map((c: any) => [c.id || c.id_contato, c]));

      // Enriquecer dados
      const garantiasCompletas = (data || []).map((item: any) => {
        const produto = produtosMap.get(item.id_produto);
        const fornecedor = item.id_fornecedor ? fornecedoresMap.get(item.id_fornecedor) : null;
        const contato = item.id_contato ? contatosMap.get(item.id_contato) : null;

        // Normalizar ID
        const idNormalizado = item.id_garantia_lote || item.id;

        return {
          ...item,
          id: idNormalizado,
          id_garantia_lote: idNormalizado,
          Produto: produto,
          Fornecedor: fornecedor,
          Contato: contato
        };
      });

      res.json(garantiasCompletas);
    } catch (error: any) {
      console.error('Erro ao listar garantias de lote:', error);
      res.status(500).json({ 
        error: error.message || 'Erro ao processar requisição',
        details: error.details || 'Verifique se as tabelas e colunas existem no banco de dados'
      });
    }
  },

  // Buscar garantia de lote por ID
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Tentar buscar com diferentes nomes de coluna de ID
      let data = null;
      let error = null;

      const result1 = await supabase
        .from('garantia_lote')
        .select('*')
        .eq('id_garantia_lote', id)
        .single();

      if (result1.error) {
        const result2 = await supabase
          .from('garantia_lote')
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
        return res.status(404).json({ error: 'Garantia de lote não encontrada' });
      }

      // Buscar dados relacionados
      let produto = null;
      if (data.id_produto) {
        const { data: produtoData } = await supabase
          .from(TABELAS.PRODUTOS)
          .select('*')
          .eq('id', data.id_produto)
          .single();
        
        if (produtoData) {
          produto = produtoData;
        } else {
          // Tentar com id_produto
          const { data: produtoData2 } = await supabase
            .from(TABELAS.PRODUTOS)
            .select('*')
            .eq('id_produto', data.id_produto)
            .single();
          produto = produtoData2;
        }
      }

      let fornecedor = null;
      if (data.id_fornecedor) {
        const { data: fornecedorData } = await supabase
          .from(TABELAS.FORNECEDORES)
          .select('*')
          .eq('id', data.id_fornecedor)
          .single();
        fornecedor = fornecedorData;
      }

      let contato = null;
      if (data.id_contato) {
        const { data: contatoData } = await supabase
          .from(TABELAS.CONTATO)
          .select('*')
          .eq('id', data.id_contato)
          .single();
        contato = contatoData;
      }

      // Normalizar ID
      const idNormalizado = data.id_garantia_lote || data.id;

      return res.json({
        ...data,
        id: idNormalizado,
        id_garantia_lote: idNormalizado,
        Produto: produto,
        Fornecedor: fornecedor,
        Contato: contato
      });
    } catch (error: any) {
      console.error('Erro ao buscar garantia de lote:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar garantia de lote
  create: async (req: Request, res: Response) => {
    try {
      const {
        id_produto,
        id_fornecedor,
        data_compra,
        id_garantia,
        tempo_garantia_fabricante_meses,
        id_contato
      } = req.body;

      if (!id_produto || !data_compra) {
        return res.status(400).json({
          error: 'id_produto e data_compra são obrigatórios'
        });
      }

      // Verificar se produto existe
      let produto = null;
      const { data: produtoData, error: produtoError } = await supabase
        .from(TABELAS.PRODUTOS)
        .select('*')
        .eq('id', id_produto)
        .single();

      if (produtoError) {
        // Tentar com id_produto
        const { data: produtoData2, error: produtoError2 } = await supabase
          .from(TABELAS.PRODUTOS)
          .select('*')
          .eq('id_produto', id_produto)
          .single();

        if (produtoError2) {
          return res.status(404).json({ error: 'Produto não encontrado' });
        }
        produto = produtoData2;
      } else {
        produto = produtoData;
      }

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Verificar fornecedor se fornecido
      if (id_fornecedor) {
        const { error: fornecedorError } = await supabase
          .from(TABELAS.FORNECEDORES)
          .select('*')
          .eq('id', id_fornecedor)
          .single();

        if (fornecedorError) {
          return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
      }

      // Verificar contato se fornecido
      if (id_contato) {
        const { error: contatoError } = await supabase
          .from(TABELAS.CONTATO)
          .select('*')
          .eq('id', id_contato)
          .single();

        if (contatoError) {
          return res.status(404).json({ error: 'Contato não encontrado' });
        }
      }

      // Inserir na tabela
      const { data: novaGarantiaLote, error: insertError } = await supabase
        .from('garantia_lote')
        .insert({
          id_produto,
          id_fornecedor: id_fornecedor || null,
          data_compra,
          id_garantia: id_garantia || null,
          tempo_garantia_fabricante_meses: tempo_garantia_fabricante_meses || null,
          id_contato: id_contato || null
        })
        .select('*')
        .single();

      if (insertError) throw insertError;

      // Buscar dados relacionados para resposta
      let produtoCompleto = produto;
      let fornecedorCompleto = null;
      let contatoCompleto = null;

      if (id_fornecedor) {
        const { data: fornecedorData } = await supabase
          .from(TABELAS.FORNECEDORES)
          .select('*')
          .eq('id', id_fornecedor)
          .single();
        fornecedorCompleto = fornecedorData;
      }

      if (id_contato) {
        const { data: contatoData } = await supabase
          .from(TABELAS.CONTATO)
          .select('*')
          .eq('id', id_contato)
          .single();
        contatoCompleto = contatoData;
      }

      // Normalizar ID
      const idNormalizado = novaGarantiaLote.id_garantia_lote || novaGarantiaLote.id;

      return res.status(201).json({
        ...novaGarantiaLote,
        id: idNormalizado,
        id_garantia_lote: idNormalizado,
        Produto: produtoCompleto,
        Fornecedor: fornecedorCompleto,
        Contato: contatoCompleto
      });
    } catch (error: any) {
      console.error('Erro ao criar garantia de lote:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar garantia de lote
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remover campos que não devem ser atualizados diretamente
      const { id: _, id_garantia_lote: __, ...dataToUpdate } = updateData;

      // Buscar garantia existente
      let garantiaExistente = null;
      let checkError = null;

      const check1 = await supabase
        .from('garantia_lote')
        .select('*')
        .eq('id_garantia_lote', id)
        .single();

      if (check1.error) {
        const check2 = await supabase
          .from('garantia_lote')
          .select('*')
          .eq('id', id)
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
        return res.status(404).json({ error: 'Garantia de lote não encontrada' });
      }

      // Validar relacionamentos se estiverem sendo atualizados
      if (dataToUpdate.id_produto) {
        const { error: produtoError } = await supabase
          .from(TABELAS.PRODUTOS)
          .select('*')
          .eq('id', dataToUpdate.id_produto)
          .single();

        if (produtoError) {
          // Tentar com id_produto
          const { error: produtoError2 } = await supabase
            .from(TABELAS.PRODUTOS)
            .select('*')
            .eq('id_produto', dataToUpdate.id_produto)
            .single();

          if (produtoError2) {
            return res.status(404).json({ error: 'Produto não encontrado' });
          }
        }
      }

      if (dataToUpdate.id_fornecedor) {
        const { error: fornecedorError } = await supabase
          .from(TABELAS.FORNECEDORES)
          .select('*')
          .eq('id', dataToUpdate.id_fornecedor)
          .single();

        if (fornecedorError) {
          return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
      }

      if (dataToUpdate.id_contato) {
        const { error: contatoError } = await supabase
          .from(TABELAS.CONTATO)
          .select('*')
          .eq('id', dataToUpdate.id_contato)
          .single();

        if (contatoError) {
          return res.status(404).json({ error: 'Contato não encontrado' });
        }
      }

      // Atualizar
      let data = null;
      let updateError = null;

      const update1 = await supabase
        .from('garantia_lote')
        .update(dataToUpdate)
        .eq('id_garantia_lote', id)
        .select('*')
        .single();

      if (update1.error) {
        const update2 = await supabase
          .from('garantia_lote')
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
        console.error('Erro ao atualizar garantia de lote:', updateError);
        throw updateError;
      }

      if (!data) {
        return res.status(404).json({ error: 'Garantia de lote não encontrada' });
      }

      // Buscar dados relacionados
      let produto = null;
      if (data.id_produto) {
        const { data: produtoData } = await supabase
          .from(TABELAS.PRODUTOS)
          .select('*')
          .eq('id', data.id_produto)
          .single();
        
        if (!produtoData) {
          const { data: produtoData2 } = await supabase
            .from(TABELAS.PRODUTOS)
            .select('*')
            .eq('id_produto', data.id_produto)
            .single();
          produto = produtoData2;
        } else {
          produto = produtoData;
        }
      }

      let fornecedor = null;
      if (data.id_fornecedor) {
        const { data: fornecedorData } = await supabase
          .from(TABELAS.FORNECEDORES)
          .select('*')
          .eq('id', data.id_fornecedor)
          .single();
        fornecedor = fornecedorData;
      }

      let contato = null;
      if (data.id_contato) {
        const { data: contatoData } = await supabase
          .from(TABELAS.CONTATO)
          .select('*')
          .eq('id', data.id_contato)
          .single();
        contato = contatoData;
      }

      // Normalizar ID
      const idNormalizado = data.id_garantia_lote || data.id;

      return res.json({
        ...data,
        id: idNormalizado,
        id_garantia_lote: idNormalizado,
        Produto: produto,
        Fornecedor: fornecedor,
        Contato: contato
      });
    } catch (error: any) {
      console.error('Erro ao atualizar garantia de lote:', error);
      return res.status(500).json({
        error: error.message,
        details: error.details || 'Verifique se a tabela e colunas existem no banco de dados'
      });
    }
  },

  // Remover garantia de lote
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID da garantia de lote é obrigatório' });
      }

      console.log('🗑️ Tentando deletar garantia de lote com ID:', id);

      // Tentar deletar usando 'id_garantia_lote' primeiro
      let deleteError = null;
      let deletado = false;

      const delete1 = await supabase
        .from('garantia_lote')
        .delete()
        .eq('id_garantia_lote', id);

      if (delete1.error) {
        console.log('Tentativa com "id_garantia_lote" falhou, tentando com "id"');
        const delete2 = await supabase
          .from('garantia_lote')
          .delete()
          .eq('id', id);

        if (delete2.error) {
          deleteError = delete2.error;
          console.error('Erro ao deletar:', delete2.error);
        } else {
          deletado = true;
          console.log('✅ Garantia de lote deletada usando id');
        }
      } else {
        deletado = true;
        console.log('✅ Garantia de lote deletada usando id_garantia_lote');
      }

      if (deleteError) {
        console.error('Erro ao deletar garantia de lote:', deleteError);
        throw deleteError;
      }

      if (!deletado) {
        return res.status(404).json({ error: 'Garantia de lote não encontrada' });
      }

      return res.json({ message: 'Garantia de lote removida com sucesso' });
    } catch (error: any) {
      console.error('Erro completo ao deletar:', error);
      return res.status(500).json({
        error: error.message,
        details: error.details || 'Verifique se a tabela e colunas existem no banco de dados'
      });
    }
  }
};



