import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const produtoController = {
  // Listar todos os produtos (com dados do fornecedor)
  getAll: async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from(TABELAS.PRODUTOS)
        .select('*')
        .order('nome_produto');

      if (error) throw error;

      // ✅ Buscar fornecedores para cada produto
      const produtosComFornecedor = await Promise.all(
        (data || []).map(async (produto: any) => {
          // Normalizar ID
          const idNormalizado = produto.id_produto || produto.id;
          
          // Buscar fornecedor se tiver id_fornecedor
          let fornecedor = null;
          if (produto.id_fornecedor) {
            try {
              // Tentar buscar com id_fornecedor primeiro
              const fornecedorResult1 = await supabase
                .from(TABELAS.FORNECEDORES)
                .select('*')
                .eq('id_fornecedor', produto.id_fornecedor)
                .single();

              if (fornecedorResult1.error) {
                // Tentar com 'id'
                const fornecedorResult2 = await supabase
                  .from(TABELAS.FORNECEDORES)
                  .select('*')
                  .eq('id', produto.id_fornecedor)
                  .single();

                if (!fornecedorResult2.error) {
                  fornecedor = fornecedorResult2.data;
                }
              } else {
                fornecedor = fornecedorResult1.data;
              }
            } catch (err) {
              console.error('Erro ao buscar fornecedor:', err);
            }
          }

          return {
            ...produto,
            id: idNormalizado,
            id_produto: idNormalizado,
            fornecedor: fornecedor ? {
              id: fornecedor.id_fornecedor || fornecedor.id,
              id_fornecedor: fornecedor.id_fornecedor || fornecedor.id,
              nome_fantasia: fornecedor.nome_fantasia,
              cnpj: fornecedor.cnpj,
              area_especialidade: fornecedor.area_especialidade,
            } : null,
          };
        })
      );

      return res.json(produtosComFornecedor);
    } catch (error: any) {
      console.error('Erro ao listar produtos:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar produto por id (com dados do fornecedor)
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Tentar diferentes nomes de coluna de ID
      let data = null;
      let error = null;

      // Tentar com 'id'
      const result1 = await supabase
        .from(TABELAS.PRODUTOS)
        .select('*')
        .eq('id', id)
        .single();

      if (result1.error) {
        // Tentar com 'id_produto'
        const result2 = await supabase
          .from(TABELAS.PRODUTOS)
          .select('*')
          .eq('id_produto', id)
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
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // ✅ NORMALIZAR: Garantir que sempre tenha 'id'
      const idNormalizado = data.id_produto || data.id;
      if (data.id_produto && !data.id) {
        data.id = data.id_produto;
      }
      if (data.id && !data.id_produto) {
        data.id_produto = data.id;
      }

      // ✅ Buscar fornecedor se tiver id_fornecedor
      let fornecedor = null;
      if (data.id_fornecedor) {
        try {
          const fornecedorResult1 = await supabase
            .from(TABELAS.FORNECEDORES)
            .select('*')
            .eq('id_fornecedor', data.id_fornecedor)
            .single();

          if (fornecedorResult1.error) {
            const fornecedorResult2 = await supabase
              .from(TABELAS.FORNECEDORES)
              .select('*')
              .eq('id', data.id_fornecedor)
              .single();

            if (!fornecedorResult2.error) {
              fornecedor = fornecedorResult2.data;
            }
          } else {
            fornecedor = fornecedorResult1.data;
          }
        } catch (err) {
          console.error('Erro ao buscar fornecedor:', err);
        }
      }

      return res.json({
        ...data,
        id: idNormalizado,
        id_produto: idNormalizado,
        fornecedor: fornecedor ? {
          id: fornecedor.id_fornecedor || fornecedor.id,
          id_fornecedor: fornecedor.id_fornecedor || fornecedor.id,
          nome_fantasia: fornecedor.nome_fantasia,
          cnpj: fornecedor.cnpj,
          area_especialidade: fornecedor.area_especialidade,
        } : null,
      });
    } catch (error: any) {
      console.error('Erro ao buscar produto:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar produto
  create: async (req: Request, res: Response) => {
    try {
      const {
        nome_produto,
        codigo_sku,
        categoria,
        unidade_medida,
        prazo_garantia_abnt_meses,
        prazo_garantia_fabrica_meses,
        frequencia_preventiva_meses,
        regras_manutencao,
        manual_pdf_url,
        id_fornecedor
      } = req.body;

      // ✅ Validar se fornecedor existe (se id_fornecedor foi fornecido)
      if (id_fornecedor) {
        const check1 = await supabase
          .from(TABELAS.FORNECEDORES)
          .select('id_fornecedor')
          .eq('id_fornecedor', id_fornecedor)
          .single();

        if (check1.error) {
          const check2 = await supabase
            .from(TABELAS.FORNECEDORES)
            .select('id')
            .eq('id', id_fornecedor)
            .single();

          if (check2.error) {
            return res.status(400).json({
              error: `Fornecedor com ID ${id_fornecedor} não encontrado`
            });
          }
        }
      }

      const { data, error } = await supabase
        .from(TABELAS.PRODUTOS)
        .insert({
          nome_produto,
          codigo_sku: codigo_sku || null,
          categoria: categoria || null,
          unidade_medida: unidade_medida || null,
          prazo_garantia_abnt_meses: prazo_garantia_abnt_meses || null,
          prazo_garantia_fabrica_meses: prazo_garantia_fabrica_meses || null,
          frequencia_preventiva_meses: frequencia_preventiva_meses || null,
          regras_manutencao: regras_manutencao || null,
          manual_pdf_url: manual_pdf_url || null,
          id_fornecedor: id_fornecedor || null
        })
        .select()
        .single();

      if (error) throw error;

      // ✅ NORMALIZAR: Garantir que sempre tenha 'id'
      const idNormalizado = data.id_produto || data.id;
      if (data && data.id_produto && !data.id) {
        data.id = data.id_produto;
      }
      if (data && data.id && !data.id_produto) {
        data.id_produto = data.id;
      }

      // ✅ Buscar fornecedor se tiver id_fornecedor
      let fornecedor = null;
      if (data.id_fornecedor) {
        try {
          const fornecedorResult1 = await supabase
            .from(TABELAS.FORNECEDORES)
            .select('*')
            .eq('id_fornecedor', data.id_fornecedor)
            .single();

          if (fornecedorResult1.error) {
            const fornecedorResult2 = await supabase
              .from(TABELAS.FORNECEDORES)
              .select('*')
              .eq('id', data.id_fornecedor)
              .single();

            if (!fornecedorResult2.error) {
              fornecedor = fornecedorResult2.data;
            }
          } else {
            fornecedor = fornecedorResult1.data;
          }
        } catch (err) {
          console.error('Erro ao buscar fornecedor:', err);
        }
      }

      return res.status(201).json({
        ...data,
        id: idNormalizado,
        id_produto: idNormalizado,
        fornecedor: fornecedor ? {
          id: fornecedor.id_fornecedor || fornecedor.id,
          id_fornecedor: fornecedor.id_fornecedor || fornecedor.id,
          nome_fantasia: fornecedor.nome_fantasia,
          cnpj: fornecedor.cnpj,
          area_especialidade: fornecedor.area_especialidade,
        } : null,
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
      const updateData = req.body;

      // Remover 'id' e 'id_produto' do updateData (não devem ser atualizados)
      const { id: _, id_produto: __, fornecedor: ___, ...dataToUpdate } = updateData;

      // ✅ Validar se fornecedor existe (se id_fornecedor foi fornecido)
      if (dataToUpdate.id_fornecedor) {
        const check1 = await supabase
          .from(TABELAS.FORNECEDORES)
          .select('id_fornecedor')
          .eq('id_fornecedor', dataToUpdate.id_fornecedor)
          .single();

        if (check1.error) {
          const check2 = await supabase
            .from(TABELAS.FORNECEDORES)
            .select('id')
            .eq('id', dataToUpdate.id_fornecedor)
            .single();

          if (check2.error) {
            return res.status(400).json({
              error: `Fornecedor com ID ${dataToUpdate.id_fornecedor} não encontrado`
            });
          }
        }
      }

      // Tentar atualizar usando 'id' primeiro, depois 'id_produto' se falhar
      let data = null;
      let error = null;

      const result1 = await supabase
        .from(TABELAS.PRODUTOS)
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (result1.error) {
        // Tentar com 'id_produto'
        const result2 = await supabase
          .from(TABELAS.PRODUTOS)
          .update(dataToUpdate)
          .eq('id_produto', id)
          .select()
          .single();

        if (result2.error) {
          error = result2.error;
        } else {
          data = result2.data;
        }
      } else {
        data = result1.data;
      }

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // ✅ NORMALIZAR: Garantir que sempre tenha 'id'
      const idNormalizado = data.id_produto || data.id;
      if (data.id_produto && !data.id) {
        data.id = data.id_produto;
      }
      if (data.id && !data.id_produto) {
        data.id_produto = data.id;
      }

      // ✅ Buscar fornecedor se tiver id_fornecedor
      let fornecedor = null;
      if (data.id_fornecedor) {
        try {
          const fornecedorResult1 = await supabase
            .from(TABELAS.FORNECEDORES)
            .select('*')
            .eq('id_fornecedor', data.id_fornecedor)
            .single();

          if (fornecedorResult1.error) {
            const fornecedorResult2 = await supabase
              .from(TABELAS.FORNECEDORES)
              .select('*')
              .eq('id', data.id_fornecedor)
              .single();

            if (!fornecedorResult2.error) {
              fornecedor = fornecedorResult2.data;
            }
          } else {
            fornecedor = fornecedorResult1.data;
          }
        } catch (err) {
          console.error('Erro ao buscar fornecedor:', err);
        }
      }

      return res.json({
        ...data,
        id: idNormalizado,
        id_produto: idNormalizado,
        fornecedor: fornecedor ? {
          id: fornecedor.id_fornecedor || fornecedor.id,
          id_fornecedor: fornecedor.id_fornecedor || fornecedor.id,
          nome_fantasia: fornecedor.nome_fantasia,
          cnpj: fornecedor.cnpj,
          area_especialidade: fornecedor.area_especialidade,
        } : null,
      });
    } catch (error: any) {
      console.error('Erro completo:', error);
      return res.status(500).json({ 
        error: error.message,
        details: error.details || 'Verifique se a tabela e colunas existem no banco de dados'
      });
    }
  },

  // Remover produto
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID do produto é obrigatório' });
      }

      console.log('🗑️ Tentando deletar produto com ID:', id);

      // Tentar deletar usando 'id' primeiro
      let deleteError = null;
      let deletado = false;

      const delete1 = await supabase
        .from(TABELAS.PRODUTOS)
        .delete()
        .eq('id', id);

      if (delete1.error) {
        console.log('Tentativa com "id" falhou, tentando com "id_produto"');
        // Tentar com 'id_produto'
        const delete2 = await supabase
          .from(TABELAS.PRODUTOS)
          .delete()
          .eq('id_produto', id);

        if (delete2.error) {
          deleteError = delete2.error;
          console.error('Erro ao deletar com id_produto:', delete2.error);
        } else {
          deletado = true;
          console.log('✅ Produto deletado usando id_produto');
        }
      } else {
        deletado = true;
        console.log('✅ Produto deletado usando id');
      }

      if (deleteError) {
        console.error('Erro ao deletar produto:', deleteError);
        throw deleteError;
      }

      if (!deletado) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      return res.json({ message: 'Produto removido com sucesso' });
    } catch (error: any) {
      console.error('Erro completo ao deletar:', error);
      return res.status(500).json({ 
        error: error.message,
        details: error.details || 'Verifique se a tabela e colunas existem no banco de dados'
      });
    }
  }
};




