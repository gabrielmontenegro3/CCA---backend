import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

const router = Router();

// Rota de debug (remover em produção)
router.get('/debug/verificar-usuarios', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABELAS.USUARIOS)
      .select('id, nome, tipo, senha')
      .limit(10);

    if (error) {
      return res.status(500).json({ 
        error: 'Erro ao buscar usuários',
        details: error.message,
        hint: error.hint,
        code: error.code
      });
    }

    // Não retornar senhas completas, apenas indicar se tem hash
    const usuariosFormatados = data?.map(u => ({
      id: u.id,
      nome: u.nome,
      tipo: u.tipo,
      senhaTemHash: u.senha?.startsWith('$2') || false,
      senhaLength: u.senha?.length || 0
    }));

    return res.json({
      total: data?.length || 0,
      tabela: TABELAS.USUARIOS,
      usuarios: usuariosFormatados
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Rota de login (deve vir antes das rotas com parâmetros)
router.post('/login', usuarioController.login);

// Rotas CRUD
router.get('/', usuarioController.getAll);
router.get('/:id', usuarioController.getById);
router.post('/', usuarioController.create);
router.put('/:id', usuarioController.update);
router.delete('/:id', usuarioController.delete);

export default router;
