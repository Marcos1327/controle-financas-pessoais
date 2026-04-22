/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorageService, KEYS } from '../storage/StorageService.js';

export const DashboardService = {
  /**
   * Calcula o resumo financeiro para um mês/ano específico
   * @param {string} monthYear - Formato "YYYY-MM"
   */
  getMonthlySummary: (monthYear) => {
    const [year, month] = monthYear.split('-').map(Number);
    
    const fixas = StorageService.getAll(KEYS.DIVIDAS_FIXAS);
    const parceladas = StorageService.getAll(KEYS.DIVIDAS_PARCELADAS);
    const avulsas = StorageService.getAll(KEYS.COMPRAS_AVULSAS);

    // Dívidas Fixas: Sempre incluídas
    const totalFixas = fixas.reduce((acc, current) => acc + Number(current.valorMensal), 0);

    // Dívidas Parceladas: Ativas no mês selecionado
    // Nota: Simplificação para o MVP. Em um sistema real, compararíamos a data de início e parcelas.
    // O PRD diz: Status = ATIVO no mês de referência.
    const totalParceladas = parceladas
      .filter(p => p.status === 'ATIVO')
      .reduce((acc, current) => acc + Number(current.valorMensal), 0);

    // Compras Avulsas: Filtradas pela data (YYYY-MM)
    const totalAvulsas = avulsas
      .filter(a => a.data.startsWith(monthYear))
      .reduce((acc, current) => acc + Number(current.valor), 0);

    const totalGeral = totalFixas + totalParceladas + totalAvulsas;

    return {
      totalFixas,
      totalParceladas,
      totalAvulsas,
      totalGeral,
      lancamentos: [
        ...fixas.map(f => ({ ...f, tipo: 'fixa' })),
        ...parceladas.filter(p => p.status === 'ATIVO').map(p => ({ ...p, tipo: 'parcelada' })),
        ...avulsas.filter(a => a.data.startsWith(monthYear)).map(a => ({ ...a, tipo: 'avulsa' }))
      ]
    };
  }
};
