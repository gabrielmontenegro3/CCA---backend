import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const fornecedorController = {
  // Listar fornecedores
  getAll: async (req: Request, res: Response) => {
    try {
      // Ordenar por ID (sempre existe)
      const { data, error } = await supabase
        .from(TABELAS.FORNECEDOR)
        .select('*')
        .order('id_fornecedor', { ascending: true });

      if (error) {
        // Tentar com 'id' se 'id_fornecedor' não existir
        const { data: data2, error: error2 } = await supabase
          .from(TABELAS.FORNECEDOR)
          .select('*')
          .order('id', { ascending: true });
        
        if (error2) throw error;
        
        // ✅ Normalizar IDs
        const fornecedoresNormalizados = (data2 || []).map((fornecedor: any) => {
          const idNormalizado = fornecedor.id_fornecedor || fornecedor.id;
          return {
            ...fornecedor,
            id: idNormalizado,
            id_fornecedor: idNormalizado,
          };
        });
        
        return res.json(fornecedoresNormalizados);
      }

      // ✅ Normalizar IDs
      const fornecedoresNormalizados = (data || []).map((fornecedor: any) => {
        const idNormalizado = fornecedor.id_fornecedor || fornecedor.id;
        return {
          ...fornecedor,
          id: idNormalizado,
          id_fornecedor: idNormalizado,
        };
      });

      res.json(fornecedoresNormalizados);
    } catch (error: any) {
      console.error('Erro ao listar fornecedores:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Buscar fornecedor por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Tentar buscar com diferentes nomes de coluna de ID
      let data = null;
      let error = null;

      const result1 = await supabase
        .from(TABELAS.FORNECEDOR)
        .select('*')
        .eq('id_fornecedor', id)
        .single();

      if (result1.error) {
        const result2 = await supabase
          .from(TABELAS.FORNECEDOR)
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
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      // ✅ Normalizar ID
      const idNormalizado = data.id_fornecedor || data.id;

      res.json({
        ...data,
        id: idNormalizado,
        id_fornecedor: idNormalizado,
      });
    } catch (error: any) {
      console.error('Erro ao buscar fornecedor:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Criar fornecedor
  create: async (req: Request, res: Response) => {
    try {
      const {
        nome_fantasia,
        cnpj,
        area_especialidade,
        fornecedor_contato
      } = req.body;

      if (!nome_fantasia) {
        return res.status(400).json({
          error: 'nome_fantasia é obrigatório'
        });
      }

      const { data, error } = await supabase
        .from(TABELAS.FORNECEDOR)
        .insert({
          nome_fantasia,
          cnpj: cnpj || null,
          area_especialidade: area_especialidade || null,
          fornecedor_contato: fornecedor_contato || null
        })
        .select()
        .single();

      if (error) throw error;

      // ✅ Normalizar ID
      const idNormalizado = data.id_fornecedor || data.id;

      res.status(201).json({
        ...data,
        id: idNormalizado,
        id_fornecedor: idNormalizado,
      });
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Atualizar fornecedor
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remover campos que não devem ser atualizados diretamente
      const { id: _, id_fornecedor: __, ...dataToUpdate } = updateData;

      // Buscar fornecedor existente
      let fornecedorExistente = null;
      let checkError = null;

      const check1 = await supabase
        .from(TABELAS.FORNECEDOR)
        .select('*')
        .eq('id_fornecedor', id)
        .single();

      if (check1.error) {
        const check2 = await supabase
          .from(TABELAS.FORNECEDOR)
          .select('*')
          .eq('id', id)
          .single();

        if (check2.error) {
          checkError = check2.error;
        } else {
          fornecedorExistente = check2.data;
        }
      } else {
        fornecedorExistente = check1.data;
      }

      if (checkError) throw checkError;

      if (!fornecedorExistente) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      // Atualizar
      let data = null;
      let updateError = null;

      const update1 = await supabase
        .from(TABELAS.FORNECEDOR)
        .update(dataToUpdate)
        .eq('id_fornecedor', id)
        .select()
        .single();

      if (update1.error) {
        const update2 = await supabase
          .from(TABELAS.FORNECEDOR)
          .update(dataToUpdate)
          .eq('id', id)
          .select()
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
        console.error('Erro ao atualizar fornecedor:', updateError);
        throw updateError;
      }

      if (!data) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      // ✅ Normalizar ID
      const idNormalizado = data.id_fornecedor || data.id;

      res.json({
        ...data,
        id: idNormalizado,
        id_fornecedor: idNormalizado,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar fornecedor:', error);
      res.status(500).json({
        error: error.message,
        details: error.details || 'Verifique se a tabela e colunas existem no banco de dados'
      });
    }
  },

  // Remover fornecedor
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID do fornecedor é obrigatório' });
      }

      console.log('🗑️ Tentando deletar fornecedor com ID:', id);

      // Tentar deletar usando 'id_fornecedor' primeiro
      let deleteError = null;
      let deletado = false;

      const delete1 = await supabase
        .from(TABELAS.FORNECEDOR)
        .delete()
        .eq('id_fornecedor', id);

      if (delete1.error) {
        console.log('Tentativa com "id_fornecedor" falhou, tentando com "id"');
        const delete2 = await supabase
          .from(TABELAS.FORNECEDOR)
          .delete()
          .eq('id', id);

        if (delete2.error) {
          deleteError = delete2.error;
          console.error('Erro ao deletar:', delete2.error);
        } else {
          deletado = true;
          console.log('✅ Fornecedor deletado usando id');
        }
      } else {
        deletado = true;
        console.log('✅ Fornecedor deletado usando id_fornecedor');
      }

      if (deleteError) {
        console.error('Erro ao deletar fornecedor:', deleteError);
        throw deleteError;
      }

      if (!deletado) {
        return res.status(404).json({ error: 'Fornecedor não encontrado' });
      }

      res.json({ message: 'Fornecedor removido com sucesso' });
    } catch (error: any) {
      console.error('Erro completo ao deletar:', error);
      res.status(500).json({
        error: error.message,
        details: error.details || 'Verifique se a tabela e colunas existem no banco de dados'
      });
    }
  }
};

