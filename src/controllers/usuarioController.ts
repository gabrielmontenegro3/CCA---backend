import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';
import bcrypt from 'bcrypt';

export const usuarioController = {
  // Listar todos os usuários
  getAll: async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id, nome, tipo')
        .order('nome', { ascending: true });

      if (error) throw error;

      return res.json(data || []);
    } catch (error: any) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: error.message || 'Erro ao listar usuários' });
    }
  },

  // Buscar usuário por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const { data, error } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id, nome, tipo')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: error.message || 'Erro ao buscar usuário' });
    }
  },

  // Criar usuário
  create: async (req: Request, res: Response) => {
    try {
      const { nome, senha, tipo } = req.body;

      // Validações
      if (!nome || !senha || !tipo) {
        return res.status(400).json({
          error: 'nome, senha e tipo são obrigatórios'
        });
      }

      // Validar tipo de usuário
      const tiposValidos = ['construtora', 'gestão tecnica', 'morador', 'administrador'];
      if (!tiposValidos.includes(tipo.toLowerCase())) {
        return res.status(400).json({
          error: `tipo deve ser um dos seguintes: ${tiposValidos.join(', ')}`
        });
      }

      // Verificar se já existe usuário com esse nome
      const { data: usuarioExistente } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id')
        .eq('nome', nome)
        .single();

      if (usuarioExistente) {
        return res.status(400).json({
          error: 'Já existe um usuário com esse nome'
        });
      }

      // Hash da senha
      const saltRounds = 10;
      const senhaHash = await bcrypt.hash(senha, saltRounds);

      const { data, error } = await supabase
        .from(TABELAS.USUARIOS)
        .insert({
          nome,
          senha: senhaHash,
          tipo: tipo.toLowerCase()
        })
        .select('id, nome, tipo')
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ error: error.message || 'Erro ao criar usuário' });
    }
  },

  // Atualizar usuário
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { nome, senha, tipo } = req.body;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      // Verificar se o usuário existe
      const { data: usuarioExistente, error: errorExistente } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id')
        .eq('id', id)
        .single();

      if (errorExistente || !usuarioExistente) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const updateData: any = {};

      if (nome !== undefined) {
        if (!nome || nome.trim() === '') {
          return res.status(400).json({ error: 'nome não pode ser vazio' });
        }
        
        // Verificar se já existe outro usuário com esse nome
        const { data: usuarioComMesmoNome } = await supabase
          .from(TABELAS.USUARIOS)
          .select('id')
          .eq('nome', nome)
          .neq('id', id)
          .single();

        if (usuarioComMesmoNome) {
          return res.status(400).json({
            error: 'Já existe outro usuário com esse nome'
          });
        }

        updateData.nome = nome;
      }
      
      if (senha !== undefined) {
        if (!senha || senha.trim() === '') {
          return res.status(400).json({ error: 'senha não pode ser vazia' });
        }
        // Hash da nova senha
        const saltRounds = 10;
        updateData.senha = await bcrypt.hash(senha, saltRounds);
      }

      if (tipo !== undefined) {
        // Validar tipo de usuário
        const tiposValidos = ['construtora', 'gestão tecnica', 'morador', 'administrador'];
        if (!tiposValidos.includes(tipo.toLowerCase())) {
          return res.status(400).json({
            error: `tipo deve ser um dos seguintes: ${tiposValidos.join(', ')}`
          });
        }
        updateData.tipo = tipo.toLowerCase();
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }

      const { data, error } = await supabase
        .from(TABELAS.USUARIOS)
        .update(updateData)
        .eq('id', id)
        .select('id, nome, tipo')
        .single();

      if (error) throw error;

      return res.json(data);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ error: error.message || 'Erro ao atualizar usuário' });
    }
  },

  // Remover usuário
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      // Verificar se o usuário existe
      const { data: usuarioExistente, error: errorExistente } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id')
        .eq('id', id)
        .single();

      if (errorExistente || !usuarioExistente) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const { error } = await supabase
        .from(TABELAS.USUARIOS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.json({ message: 'Usuário removido com sucesso' });
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error);
      return res.status(500).json({ error: error.message || 'Erro ao remover usuário' });
    }
  },

  // Login/Autenticação de usuário
  login: async (req: Request, res: Response) => {
    try {
      const { nome, senha } = req.body;

      if (!nome || !senha) {
        return res.status(400).json({
          error: 'nome e senha são obrigatórios'
        });
      }

      console.log('Tentativa de login para:', nome);
      console.log('Buscando na tabela:', TABELAS.USUARIOS);

      // Buscar usuário por nome (case-insensitive)
      const { data: usuarios, error: errorList } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id, nome, senha, tipo');

      if (errorList) {
        console.error('Erro ao buscar usuários:', errorList);
        return res.status(500).json({ 
          error: 'Erro ao buscar usuário',
          details: errorList.message 
        });
      }

      // Buscar usuário com match exato (case-sensitive primeiro)
      let usuario = usuarios?.find(u => u.nome === nome);
      
      // Se não encontrou, tentar case-insensitive
      if (!usuario) {
        usuario = usuarios?.find(u => u.nome.toLowerCase() === nome.toLowerCase());
      }

      if (!usuario) {
        console.log('Usuário não encontrado. Usuários disponíveis:', usuarios?.map(u => u.nome));
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      console.log('Usuário encontrado:', usuario.nome, 'ID:', usuario.id);
      console.log('Senha no banco começa com:', usuario.senha?.substring(0, 10));

      // Verificar se a senha está com hash bcrypt (começa com $2a$, $2b$ ou $2y$)
      const senhaComHash = usuario.senha && (
        usuario.senha.startsWith('$2a$') || 
        usuario.senha.startsWith('$2b$') || 
        usuario.senha.startsWith('$2y$')
      );

      let senhaValida = false;

      if (senhaComHash) {
        // Senha está com hash, usar bcrypt.compare
        senhaValida = await bcrypt.compare(senha, usuario.senha);
        console.log('Comparação bcrypt:', senhaValida);
      } else {
        // Senha não está com hash (inserida manualmente), comparar diretamente
        console.log('AVISO: Senha não está com hash bcrypt. Comparando diretamente.');
        senhaValida = usuario.senha === senha;
        console.log('Comparação direta:', senhaValida);
        
        // Se a senha estiver correta mas sem hash, recomendar atualizar
        if (senhaValida) {
          console.log('AVISO: Usuário autenticado, mas senha não está com hash. Considere atualizar a senha.');
        }
      }

      if (!senhaValida) {
        console.log('Senha inválida');
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Retornar dados do usuário (sem a senha)
      return res.json({
        id: usuario.id,
        nome: usuario.nome,
        tipo: usuario.tipo
      });
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      return res.status(500).json({ error: error.message || 'Erro ao fazer login' });
    }
  }
};
