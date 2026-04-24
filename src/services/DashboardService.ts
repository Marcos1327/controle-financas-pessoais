import { StorageService, KEYS } from './StorageService';
import { Transaction, DashboardSummary } from '../types';

export const DashboardService = {
  getMonthlySummary: async (monthYear: string | string[], preloadedData: any = null): Promise<DashboardSummary> => {
    const months = Array.isArray(monthYear) ? monthYear : [monthYear];
    
    const { fixas, parceladas, avulsas } = preloadedData || {
      fixas: await StorageService.getAll(KEYS.DIVIDAS_FIXAS),
      parceladas: await StorageService.getAll(KEYS.DIVIDAS_PARCELADAS),
      avulsas: await StorageService.getAll(KEYS.COMPRAS_AVULSAS)
    };

    let totalFixas = 0;
    let totalParceladas = 0;
    let totalAvulsas = 0;
    let allLancamentos: Transaction[] = [];

    months.forEach(my => {
      totalFixas += fixas.reduce((acc: number, current: any) => acc + Number(current.valorMensal), 0);

      totalParceladas += parceladas
        .filter((p: any) => p.status === 'ATIVO' || p.status === 'PAGO' || p.status === 'PENDENTE')
        .reduce((acc: number, current: any) => acc + Number(current.valorMensal), 0);

      totalAvulsas += avulsas
        .filter((a: any) => a.data.startsWith(my))
        .reduce((acc: number, current: any) => acc + Number(current.valor), 0);

      allLancamentos.push(
        ...fixas.map((f: any) => ({ ...f, tipo: 'fixa' as const, dataRef: my })),
        ...parceladas.filter((p: any) => p.status === 'ATIVO' || p.status === 'PAGO' || p.status === 'PENDENTE').map((p: any) => ({ ...p, tipo: 'parcelada' as const, dataRef: my })),
        ...avulsas.filter((a: any) => a.data.startsWith(my)).map((a: any) => ({ ...a, tipo: 'avulsa' as const, dataRef: my }))
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

  getAllData: async () => {
    const fixas = await StorageService.getAll(KEYS.DIVIDAS_FIXAS);
    const parceladas = await StorageService.getAll(KEYS.DIVIDAS_PARCELADAS);
    const avulsas = await StorageService.getAll(KEYS.COMPRAS_AVULSAS);

    return { fixas, parceladas, avulsas };
  }
};
