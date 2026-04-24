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
      const [vYear, vMonth] = my.split('-').map(Number);
      
      const activeFixas = fixas;
      const activeParceladas = parceladas.filter((p: any) => {
        if (!p.data) return false;
        const [pYear, pMonth] = p.data.split('-').map(Number);
        const diff = (vYear * 12 + vMonth) - (pYear * 12 + pMonth);
        return diff >= 1 && diff <= Number(p.parcelas);
      }).map((p: any) => {
        const [pYear, pMonth] = p.data.split('-').map(Number);
        const diff = (vYear * 12 + vMonth) - (pYear * 12 + pMonth);
        const isPaidInThisMonth = (p.parcelaAtual || 0) >= diff;
        
        return { 
          ...p, 
          tipo: 'parcelada' as const, 
          dataRef: my, 
          status: isPaidInThisMonth ? 'PAGO' : 'PENDENTE',
          parcelaVirtual: diff
        };
      });

      const activeAvulsas = avulsas.filter((a: any) => a.data && a.data.startsWith(my));

      totalFixas += activeFixas.reduce((acc: number, current: any) => acc + (Number(current.valorMensal) || 0), 0);
      totalParceladas += activeParceladas.reduce((acc: number, current: any) => acc + (Number(current.valorMensal) || 0), 0);
      totalAvulsas += activeAvulsas.reduce((acc: number, current: any) => acc + (Number(current.valor) || 0), 0);

      allLancamentos.push(
        ...activeFixas.map((f: any) => ({ ...f, tipo: 'fixa' as const, dataRef: my })),
        ...activeParceladas,
        ...activeAvulsas.map((a: any) => ({ ...a, tipo: 'avulsa' as const, dataRef: my }))
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
