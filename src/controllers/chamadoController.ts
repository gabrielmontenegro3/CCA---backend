import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';
import { uploadFiles } from '../services/storageService';

// Helper para obter ID do usuário logado (pode vir de header ou body)
function getUsuarioLogado(req: Request): number | null {
  // Tentar obter do header primeiro
  const userIdHeader = req.headers['x-user-id'];
  if (userIdHeader) {
    const userId = Number(userIdHeader);
    if (!isNaN(userId)) return userId;
  }

  // Tentar obter do body
  if (req.body.usuario_id) {
    const userId = Number(req.body.usuario_id);
    if (!isNaN(userId)) return userId;
  }

  return null;
}

// Helper para obter tipo do usuário
async function getTipoUsuario(usuarioId: number): Promise<string | null> {
  const { data: usuario } = await supabase
    .from(TABELAS.USUARIOS)
    .select('tipo')
    .eq('id', usuarioId)
    .single();

  return usuario?.tipo || null;
}

// Helper para determinar tipo de autor baseado no tipo de usuário
async function getAutorTipo(usuarioId: number): Promise<'usuario' | 'tecnico'> {
  const tipo = await getTipoUsuario(usuarioId);

  // Se for 'gestão tecnica' ou 'administrador', é técnico
  if (tipo === 'gestão tecnica' || tipo === 'administrador') {
    return 'tecnico';
  }

  return 'usuario';
}

// Helper para verificar se usuário pode escrever mensagens
async function podeEscreverMensagem(usuarioId: number): Promise<boolean> {
  const tipo = await getTipoUsuario(usuarioId);
  
  // Construtora não pode escrever (apenas leitura)
  if (tipo === 'construtora') {
    return false;
  }
  
  // Morador, Gestão Técnica e Administrador podem escrever
  return true;
}

export const chamadoController = {
  // 1️⃣ CRIAR CHAMADO (com mensagem inicial e anexos opcionais)
  create: async (req: Request, res: Response) => {
    try {
      // Log para debug
      console.log('Body recebido:', req.body);
      console.log('Files recebidos:', req.files);
      console.log('Headers:', req.headers);

      const titulo = req.body.titulo;
      const descricao = req.body.descricao;
      const status = req.body.status;
      const usuarioId = getUsuarioLogado(req);

      console.log('Dados extraídos:', { titulo, descricao, status, usuarioId });

      // Validações
      if (!titulo || (typeof titulo === 'string' && !titulo.trim())) {
        return res.status(400).json({ error: 'titulo é obrigatório' });
      }

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuário não identificado. Envie x-user-id no header ou usuario_id no body' });
      }

      // Verificar se o usuário existe
      const { data: usuarioExistente, error: usuarioError } = await supabase
        .from(TABELAS.USUARIOS)
        .select('id')
        .eq('id', usuarioId)
        .single();

      if (usuarioError || !usuarioExistente) {
        return res.status(400).json({ error: 'Usuário não encontrado' });
      }

      // Criar chamado
      const tituloLimpo = typeof titulo === 'string' ? titulo.trim() : String(titulo).trim();
      const descricaoLimpa = descricao ? (typeof descricao === 'string' ? descricao.trim() : String(descricao)) : null;
      
      console.log('Criando chamado com:', { titulo: tituloLimpo, descricao: descricaoLimpa, usuario: usuarioId, status: status || 'aberto' });

      const { data: chamado, error: chamadoError } = await supabase
        .from(TABELAS.CHAMADO)
        .insert({
          titulo: tituloLimpo,
          descricao: descricaoLimpa,
          usuario: usuarioId,
          status: status || 'aberto'
        })
        .select('*')
        .single();

      if (chamadoError) {
        console.error('Erro ao criar chamado no banco:', chamadoError);
        throw chamadoError;
      }

      console.log('Chamado criado com sucesso:', chamado);

      // Criar mensagem inicial
      const autorTipo = await getAutorTipo(usuarioId);
      const mensagemTexto = descricaoLimpa || tituloLimpo;
      
      console.log('Criando mensagem inicial:', { chamado_id: chamado.id, autor_id: usuarioId, autor_tipo: autorTipo, mensagem: mensagemTexto });

      const { data: mensagemInicial, error: mensagemError } = await supabase
        .from(TABELAS.MENSAGENS_CHAMADO)
        .insert({
          chamado_id: chamado.id,
          autor_id: usuarioId,
          autor_tipo: autorTipo,
          mensagem: mensagemTexto
        })
        .select('*')
        .single();

      if (mensagemError) {
        console.error('Erro ao criar mensagem inicial:', mensagemError);
        throw mensagemError;
      }

      console.log('Mensagem inicial criada:', mensagemInicial);

      // Processar anexos se houver
      // req.files pode ser array ou objeto dependendo do multer
      const anexos: any[] = [];
      let files: Express.Multer.File[] = [];
      
      if (req.files) {
        if (Array.isArray(req.files)) {
          files = req.files;
        } else if (typeof req.files === 'object') {
          // Se for objeto, converter para array
          files = Object.values(req.files).flat();
        }
      }

      if (files.length > 0) {
        const folder = `chamados/${chamado.id}/anexos`;
        
        console.log(`Fazendo upload de ${files.length} arquivo(s)`);
        
        // Upload dos arquivos
        const urls = await uploadFiles(files, folder);

        // Criar registros de anexos
        for (let i = 0; i < files.length; i++) {
          const { data: anexo, error: anexoError } = await supabase
            .from(TABELAS.ANEXOS_MENSAGEM)
            .insert({
              mensagem_id: mensagemInicial.id,
              url: urls[i],
              tipo: files[i].mimetype
            })
            .select('*')
            .single();

          if (!anexoError && anexo) {
            anexos.push({
              id: anexo.id,
              url: anexo.url,
              tipo: anexo.tipo
            });
          }
        }
      }

      // Buscar mensagens com anexos
      // Primeiro buscar mensagens
      const { data: mensagens, error: mensagensError } = await supabase
        .from(TABELAS.MENSAGENS_CHAMADO)
        .select('*')
        .eq('chamado_id', chamado.id)
        .order('created_at', { ascending: true });

      if (mensagensError) {
        console.error('Erro ao buscar mensagens:', mensagensError);
        throw mensagensError;
      }

      // Buscar anexos para cada mensagem
      const mensagensComAnexos = await Promise.all(
        (mensagens || []).map(async (msg: any) => {
          const { data: anexos } = await supabase
            .from(TABELAS.ANEXOS_MENSAGEM)
            .select('id, url, tipo')
            .eq('mensagem_id', msg.id);
          
          return {
            ...msg,
            anexos: anexos || []
          };
        })
      );

      // Formatar resposta
      const mensagensFormatadas = mensagensComAnexos.map((msg: any) => ({
        id: msg.id,
        autor_tipo: msg.autor_tipo,
        autor_id: msg.autor_id,
        mensagem: msg.mensagem,
        created_at: msg.created_at,
        anexos: msg.anexos || []
      }));

      return res.status(201).json({
        ...chamado,
        mensagens: mensagensFormatadas
      });
    } catch (error: any) {
      console.error('Erro ao criar chamado:', error);
      console.error('Stack trace:', error.stack);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({ 
        error: 'Erro ao criar chamado',
        message: error.message || 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          details: error.details,
          hint: error.hint
        } : undefined
      });
    }
  },

  // 2️⃣ LISTAR CHAMADOS (com filtro por tipo de usuário)
  getAll: async (req: Request, res: Response) => {
    try {
      const usuarioId = getUsuarioLogado(req);

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuário não identificado. Envie x-user-id no header ou usuario_id no query' });
      }

      // Obter tipo do usuário
      const tipoUsuario = await getTipoUsuario(usuarioId);
      
      if (!tipoUsuario) {
        return res.status(400).json({ error: 'Tipo de usuário não encontrado' });
      }

      let query = supabase
        .from(TABELAS.CHAMADO)
        .select('*');

      // Morador: vê apenas seus próprios chamados
      if (tipoUsuario === 'morador') {
        query = query.eq('usuario', usuarioId);
      }
      // Gestão Técnica, Administrador e Construtora: vêem todos os chamados
      // (não precisa filtrar)

      const { data: chamados, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;

      return res.json(chamados || []);
    } catch (error: any) {
      console.error('Erro ao listar chamados:', error);
      return res.status(500).json({ error: error.message || 'Erro ao listar chamados' });
    }
  },

  // 3️⃣ DETALHAR CHAMADO + CHAT
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const usuarioId = getUsuarioLogado(req);

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuário não identificado' });
      }

      // Buscar chamado
      const { data: chamado, error: chamadoError } = await supabase
        .from(TABELAS.CHAMADO)
        .select('*')
        .eq('id', id)
        .single();

      if (chamadoError || !chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      // Obter tipo do usuário
      const tipoUsuario = await getTipoUsuario(usuarioId);
      
      if (!tipoUsuario) {
        return res.status(400).json({ error: 'Tipo de usuário não encontrado' });
      }

      // Validar acesso baseado no tipo de usuário
      if (tipoUsuario === 'morador') {
        // Morador: apenas seus próprios chamados
        if (chamado.usuario !== usuarioId) {
          return res.status(403).json({ error: 'Acesso negado. Você só pode ver seus próprios chamados' });
        }
      }
      // Gestão Técnica, Administrador e Construtora: podem ver todos os chamados
      // (não precisa validar)

      // Buscar mensagens
      const { data: mensagens, error: mensagensError } = await supabase
        .from(TABELAS.MENSAGENS_CHAMADO)
        .select('*')
        .eq('chamado_id', id)
        .order('created_at', { ascending: true });

      if (mensagensError) {
        console.error('Erro ao buscar mensagens:', mensagensError);
        throw mensagensError;
      }

      // Buscar anexos para cada mensagem
      const mensagensComAnexos = await Promise.all(
        (mensagens || []).map(async (msg: any) => {
          const { data: anexos } = await supabase
            .from(TABELAS.ANEXOS_MENSAGEM)
            .select('id, url, tipo')
            .eq('mensagem_id', msg.id);
          
          return {
            ...msg,
            anexos: anexos || []
          };
        })
      );

      // Formatar mensagens conforme modelo padrão
      const mensagensFormatadas = mensagensComAnexos.map((msg: any) => ({
        id: msg.id,
        autor_tipo: msg.autor_tipo,
        autor_id: msg.autor_id,
        mensagem: msg.mensagem,
        created_at: msg.created_at,
        anexos: msg.anexos.map((anexo: any) => ({
          id: anexo.id,
          url: anexo.url,
          tipo: anexo.tipo
        }))
      }));

      // Adicionar informação sobre permissões do usuário
      const podeEscrever = await podeEscreverMensagem(usuarioId);

      return res.json({
        ...chamado,
        mensagens: mensagensFormatadas,
        permissoes: {
          pode_escrever: podeEscrever,
          tipo_usuario: tipoUsuario
        }
      });
    } catch (error: any) {
      console.error('Erro ao buscar chamado:', error);
      return res.status(500).json({ error: error.message || 'Erro ao buscar chamado' });
    }
  },

  // 4️⃣ ENVIAR MENSAGEM (USUÁRIO OU TÉCNICO)
  enviarMensagem: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { mensagem } = req.body;
      const usuarioId = getUsuarioLogado(req);

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID do chamado inválido' });
      }

      if (!mensagem || !mensagem.trim()) {
        return res.status(400).json({ error: 'mensagem é obrigatória' });
      }

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuário não identificado' });
      }

      // Verificar se o usuário pode escrever mensagens
      const podeEscrever = await podeEscreverMensagem(usuarioId);
      
      if (!podeEscrever) {
        return res.status(403).json({ 
          error: 'Acesso negado. Usuários do tipo "construtora" não podem enviar mensagens. Apenas leitura permitida.' 
        });
      }

      // Verificar se o chamado existe
      const { data: chamado, error: chamadoError } = await supabase
        .from(TABELAS.CHAMADO)
        .select('*')
        .eq('id', id)
        .single();

      if (chamadoError || !chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      // Validar acesso ao chamado
      const tipoUsuario = await getTipoUsuario(usuarioId);
      
      if (tipoUsuario === 'morador') {
        // Morador: apenas seus próprios chamados
        if (chamado.usuario !== usuarioId) {
          return res.status(403).json({ error: 'Acesso negado. Você só pode enviar mensagens em seus próprios chamados' });
        }
      }
      // Gestão Técnica e Administrador: podem enviar mensagens em qualquer chamado
      // (não precisa validar)

      // Determinar tipo de autor
      const autorTipo = await getAutorTipo(usuarioId);

      // Criar mensagem
      const { data: novaMensagem, error: mensagemError } = await supabase
        .from(TABELAS.MENSAGENS_CHAMADO)
        .insert({
          chamado_id: Number(id),
          autor_id: usuarioId,
          autor_tipo: autorTipo,
          mensagem: mensagem.trim()
        })
        .select('*')
        .single();

      if (mensagemError) throw mensagemError;

      // Processar anexos se houver
      const anexos: any[] = [];
      let files: Express.Multer.File[] = [];
      
      if (req.files) {
        if (Array.isArray(req.files)) {
          files = req.files;
        } else if (typeof req.files === 'object') {
          // Se for objeto, converter para array
          files = Object.values(req.files).flat();
        }
      }

      if (files.length > 0) {
        const folder = `chamados/${id}/anexos`;
        
        console.log(`Fazendo upload de ${files.length} arquivo(s) para mensagem`);
        
        // Upload dos arquivos
        const urls = await uploadFiles(files, folder);

        // Criar registros de anexos
        for (let i = 0; i < files.length; i++) {
          const { data: anexo, error: anexoError } = await supabase
            .from(TABELAS.ANEXOS_MENSAGEM)
            .insert({
              mensagem_id: novaMensagem.id,
              url: urls[i],
              tipo: files[i].mimetype
            })
            .select('*')
            .single();

          if (!anexoError && anexo) {
            anexos.push({
              id: anexo.id,
              url: anexo.url,
              tipo: anexo.tipo
            });
          }
        }
      }

      // Atualizar updated_at do chamado
      await supabase
        .from(TABELAS.CHAMADO)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      // Retornar mensagem formatada
      return res.status(201).json({
        id: novaMensagem.id,
        autor_tipo: novaMensagem.autor_tipo,
        autor_id: novaMensagem.autor_id,
        mensagem: novaMensagem.mensagem,
        created_at: novaMensagem.created_at,
        anexos
      });
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      return res.status(500).json({ error: error.message || 'Erro ao enviar mensagem' });
    }
  },

  // 5️⃣ ATUALIZAR STATUS DO CHAMADO
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const usuarioId = getUsuarioLogado(req);

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      if (!status) {
        return res.status(400).json({ error: 'status é obrigatório' });
      }

      if (!usuarioId) {
        return res.status(400).json({ error: 'Usuário não identificado' });
      }

      // Validar status
      const statusValidos = ['aberto', 'em_andamento', 'resolvido', 'cancelado'];
      if (!statusValidos.includes(status.toLowerCase())) {
        return res.status(400).json({
          error: `status deve ser um dos seguintes: ${statusValidos.join(', ')}`
        });
      }

      // Verificar se o chamado existe
      const { data: chamado, error: chamadoError } = await supabase
        .from(TABELAS.CHAMADO)
        .select('*')
        .eq('id', id)
        .single();

      if (chamadoError || !chamado) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      // Obter tipo do usuário para validar permissões
      const tipoUsuario = await getTipoUsuario(usuarioId);
      
      if (!tipoUsuario) {
        return res.status(400).json({ error: 'Tipo de usuário não encontrado' });
      }

      // Validar permissões para atualizar status
      // Morador: pode atualizar apenas seus próprios chamados
      if (tipoUsuario === 'morador') {
        if (chamado.usuario !== usuarioId) {
          return res.status(403).json({ 
            error: 'Acesso negado. Você só pode atualizar seus próprios chamados' 
          });
        }
      }
      // Gestão Técnica, Administrador e Construtora: podem atualizar qualquer chamado
      // (não precisa validar)

      // Atualizar status
      const { data: chamadoAtualizado, error: updateError } = await supabase
        .from(TABELAS.CHAMADO)
        .update({ 
          status: status.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      return res.json(chamadoAtualizado);
    } catch (error: any) {
      console.error('Erro ao atualizar status do chamado:', error);
      return res.status(500).json({ error: error.message || 'Erro ao atualizar status do chamado' });
    }
  }
};

