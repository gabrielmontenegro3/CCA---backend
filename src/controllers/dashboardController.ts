import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

export const dashboardController = {
  getDashboard: async (req: Request, res: Response) => {
    try {
      // Total de unidades
      const { count: totalUnidades, error: unidadesError } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*', { count: 'exact', head: true });

      if (unidadesError) throw unidadesError;

      // Buscar todas as unidades
      const { data: unidades, error: unidadesDataError } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*');

      if (unidadesDataError) throw unidadesDataError;

      // Buscar empreendimentos
      const empreendimentosIds = unidades?.map((u: any) => u.id_empreendimento) || [];
      const { data: empreendimentos, error: empreendimentosError } = await supabase
        .from(TABELAS.EMPREENDIMENTO)
        .select('*')
        .in('id', empreendimentosIds);

      if (empreendimentosError) throw empreendimentosError;

      const empreendimentosMap = new Map(empreendimentos?.map((e: any) => [e.id, e]) || []);

      // Buscar produtos das unidades
      const unidadesIds = unidades?.map((u: any) => u.id) || [];
      const { data: unidadesProdutos, error: unidadesProdutosError } = await supabase
        .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
        .select('*')
        .in('id_unidade', unidadesIds);

      if (unidadesProdutosError) throw unidadesProdutosError;

      // Buscar produtos
      const produtosIds = unidadesProdutos?.map((up: any) => up.id_produto) || [];
      const { data: produtos, error: produtosError } = await supabase
        .from(TABELAS.PRODUTO)
        .select('*')
        .in('id', produtosIds);

      if (produtosError) throw produtosError;

      const produtosMap = new Map(produtos?.map((p: any) => [p.id, p]) || []);

      // Calcular garantias
      let totalGarantiasValidas = 0;
      let totalGarantiasVencidas = 0;
      let garantiasVencendo90Dias = 0;
      const hoje = new Date();
      const em90Dias = new Date();
      em90Dias.setDate(em90Dias.getDate() + 90);

      const proximosPreventivos: any[] = [];

      unidades?.forEach((unidade: any) => {
        const empreendimento = empreendimentosMap.get(unidade.id_empreendimento);
        const dataBase = unidade.data_instalacao
          ? new Date(unidade.data_instalacao)
          : empreendimento?.data_entrega_chaves
          ? new Date(empreendimento.data_entrega_chaves)
          : new Date();

        const produtosDaUnidade = unidadesProdutos?.filter((up: any) => up.id_unidade === unidade.id) || [];

        produtosDaUnidade.forEach((upg: any) => {
          const produto = produtosMap.get(upg.id_produto);

          if (produto) {
            // Garantia ABNT
            if (produto.prazo_garantia_abnt_meses) {
              const dataFim = new Date(dataBase);
              dataFim.setMonth(dataFim.getMonth() + produto.prazo_garantia_abnt_meses);

              if (hoje <= dataFim) {
                totalGarantiasValidas++;
              } else {
                totalGarantiasVencidas++;
              }

              if (hoje <= dataFim && dataFim <= em90Dias) {
                garantiasVencendo90Dias++;
              }
            }

            // Garantia Fábrica
            if (produto.prazo_garantia_fabrica_meses) {
              const dataFim = new Date(dataBase);
              dataFim.setMonth(dataFim.getMonth() + produto.prazo_garantia_fabrica_meses);

              if (hoje <= dataFim) {
                totalGarantiasValidas++;
              } else {
                totalGarantiasVencidas++;
              }

              if (hoje <= dataFim && dataFim <= em90Dias) {
                garantiasVencendo90Dias++;
              }
            }

            // Próximos preventivos
            if (produto.frequencia_preventiva_meses && upg.data_instalacao) {
              const dataInstalacao = new Date(upg.data_instalacao);
              const proximoPreventivo = new Date(dataInstalacao);
              proximoPreventivo.setMonth(proximoPreventivo.getMonth() + produto.frequencia_preventiva_meses);

              // Buscar último preventivo realizado (se houver campo de histórico)
              // Por enquanto, calculamos baseado na data de instalação
              if (proximoPreventivo >= hoje && proximoPreventivo <= em90Dias) {
                proximosPreventivos.push({
                  id_unidade: unidade.id,
                  id_produto: produto.id,
                  unidade: unidade.numero || unidade.id,
                  produto: produto.nome_produto,
                  data_proximo_preventivo: proximoPreventivo.toISOString().split('T')[0],
                  frequencia_meses: produto.frequencia_preventiva_meses
                });
              }
            }
          }
        });
      });

      // Total de chamados abertos
      const { count: chamadosAbertos, error: chamadosAbertosError } = await supabase
        .from(TABELAS.CHAMADO)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ABERTO');

      if (chamadosAbertosError) throw chamadosAbertosError;

      // Total de chamados finalizados
      const { count: chamadosFinalizados, error: chamadosFinalizadosError } = await supabase
        .from(TABELAS.CHAMADO)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'FINALIZADO');

      if (chamadosFinalizadosError) throw chamadosFinalizadosError;

      // Ordenar próximos preventivos por data
      proximosPreventivos.sort((a, b) => 
        new Date(a.data_proximo_preventivo).getTime() - new Date(b.data_proximo_preventivo).getTime()
      );

      res.json({
        total_unidades: totalUnidades || 0,
        total_garantias_validas: totalGarantiasValidas,
        total_garantias_vencidas: totalGarantiasVencidas,
        garantias_vencendo_90_dias: garantiasVencendo90Dias,
        total_chamados_abertos: chamadosAbertos || 0,
        total_chamados_finalizados: chamadosFinalizados || 0,
        proximos_preventivos: proximosPreventivos.slice(0, 10) // Limitar a 10 próximos
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};

