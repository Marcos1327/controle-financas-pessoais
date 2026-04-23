/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorageService, KEYS } from '../storage/StorageService.js';

export const DashboardService = {
  /**
   * Calcula o resumo financeiro para um ou mais meses/anos específicos
   * @param {string|string[]} monthYear - Formato "YYYY-MM" ou array de "YYYY-MM"
   * @param {Object} preloadedData - Dados opcionais já carregados
   */
  getMonthlySummary: async (monthYear, preloadedData = null) => {
    const months = Array.isArray(monthYear) ? monthYear : [monthYear];
    
    // Se passarmos os dados pré-carregados, economizamos 3 leituras de storage
    const { fixas, parceladas, avulsas } = preloadedData || {
      fixas: await StorageService.getAll(KEYS.DIVIDAS_FIXAS),
      parceladas: await StorageService.getAll(KEYS.DIVIDAS_PARCELADAS),
      avulsas: await StorageService.getAll(KEYS.COMPRAS_AVULSAS)
    };

    let totalFixas = 0;
    let totalParceladas = 0;
    let totalAvulsas = 0;
    let allLancamentos = [];

    // Para cada mês selecionado, somamos os valores e notas
    months.forEach(my => {
      // Dívidas Fixas: Sempre incluídas (uma vez por mês selecionado)
      totalFixas += fixas.reduce((acc, current) => acc + Number(current.valorMensal), 0);

      // Dívidas Parceladas: Ativas no mês selecionado
      totalParceladas += parceladas
        .filter(p => p.status === 'ATIVO' || p.status === 'PAGO' || p.status === 'PENDENTE')
        .reduce((acc, current) => acc + Number(current.valorMensal), 0);

      // Compras Avulsas: Filtradas pela data (YYYY-MM)
      totalAvulsas += avulsas
        .filter(a => a.data.startsWith(my))
        .reduce((acc, current) => acc + Number(current.valor), 0);

      // Agregamos lançamentos (evitando duplicar fixas/parceladas na visualização se desejar, 
      // mas aqui vamos tratar como lançamentos por mês selecionado)
      allLancamentos.push(
        ...fixas.map(f => ({ ...f, tipo: 'fixa', dataRef: my })),
        ...parceladas.filter(p => p.status === 'ATIVO' || p.status === 'PAGO' || p.status === 'PENDENTE').map(p => ({ ...p, tipo: 'parcelada', dataRef: my })),
        ...avulsas.filter(a => a.data.startsWith(my)).map(a => ({ ...a, tipo: 'avulsa', dataRef: my }))
      );
    });

    const totalGeral = totalFixas + totalParceladas + totalAvulsas;

    return {
      totalFixas,
      totalParceladas,
      totalAvulsas,
      totalGeral,
      lancamentos: allLancamentos
    };
  },

  /**
   * Busca todos os dados de todas as coleções para processamento de filtros
   */
  getAllData: async () => {
    const fixas = await StorageService.getAll(KEYS.DIVIDAS_FIXAS);
    const parceladas = await StorageService.getAll(KEYS.DIVIDAS_PARCELADAS);
    const avulsas = await StorageService.getAll(KEYS.COMPRAS_AVULSAS);

    return { fixas, parceladas, avulsas };
  }
};
