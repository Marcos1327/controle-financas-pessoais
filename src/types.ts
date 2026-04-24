/**
 * Finanças Pro - Types
 */

export type TransactionType = 'fixa' | 'parcelada' | 'avulsa';
export type TransactionStatus = 'PENDENTE' | 'PAGO' | 'ATIVO' | 'FINALIZADO';

export interface Category {
  id: string;
  nome: string;
  userId: string;
}

export interface Card {
  id: string;
  nome: string;
  userId: string;
}

export interface Transaction {
  id: string;
  descricao: string;
  valor: number | string;
  valorMensal?: number | string;
  data?: string; // YYYY-MM-DD
  dataRef?: string; // YYYY-MM
  categoria?: string;
  formaPagamento?: string;
  cartao?: string;
  status: TransactionStatus;
  tipo?: TransactionType;
  parcelas?: number;
  parcelaAtual?: number;
  userId: string;
  createdAt: number;
}

export interface InstallmentDebt extends Transaction {
  custoTotal: number;
}

export interface DashboardSummary {
  totalFixas: number;
  totalParceladas: number;
  totalAvulsas: number;
  totalGeral: number;
  lancamentos: Transaction[];
}
