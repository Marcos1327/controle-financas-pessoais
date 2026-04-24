import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Modal } from '../../components/ui/Modal/Modal';
import { StorageService, KEYS } from '../../services/StorageService';
import { InstallmentDebt } from '../../types';
import './Installments.css';

export const Installments: React.FC = () => {
  const { setIsSidebarVisible } = useOutletContext<{ setIsSidebarVisible: (v: boolean) => void }>();
  const [items, setItems] = useState<InstallmentDebt[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const res = await StorageService.getAll(KEYS.DIVIDAS_PARCELADAS);
    setItems(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const custoTotal = Number(fd.get('custoTotal'));
    const parcelas = Number(fd.get('parcelas'));
    
    const newItem = {
      id: crypto.randomUUID(),
      descricao: fd.get('descricao') as string,
      custoTotal,
      parcelas,
      parcelaAtual: 1,
      valorMensal: (custoTotal / parcelas).toFixed(2),
      status: 'ATIVO',
      createdAt: Date.now()
    };

    await StorageService.add(KEYS.DIVIDAS_PARCELADAS, newItem);
    setIsModalOpen(false);
    fetchData();
  };

  const handleIncrement = async (item: InstallmentDebt) => {
    const nextParcela = Number(item.parcelaAtual) + 1;
    const isFinished = nextParcela >= item.parcelas!;
    
    await StorageService.update(KEYS.DIVIDAS_PARCELADAS, {
      ...item,
      parcelaAtual: isFinished ? item.parcelas : nextParcela,
      status: isFinished ? 'FINALIZADO' : 'ATIVO'
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      await StorageService.remove(KEYS.DIVIDAS_PARCELADAS, id);
      fetchData();
    }
  };

  return (
    <div className="installments-page">
      <PageHeader 
        breadcrumb="Gestão" 
        current="Parcelamentos" 
        onMenuClick={() => setIsSidebarVisible(true)}
        actions={
          <button className="btn btn-primary desktop-only" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Novo Parcelamento
          </button>
        }
      />

      <div className="content-padding">
        <button className="btn btn-primary mobile-fab" onClick={() => setIsModalOpen(true)}>
          <Plus size={28} />
        </button>

        {loading ? (
          <div className="loading">Carregando parcelamentos...</div>
        ) : (
          <div className="grid-stats">
            {items.length > 0 ? items.map(item => (
              <div key={item.id} className="card installment-card">
                <div className="card-header-row">
                  <div>
                    <h4 className="item-desc">{item.descricao}</h4>
                    <p className="item-status">{item.status}</p>
                  </div>
                  <span className="badge badge-parcela">R$ {Number(item.valorMensal).toFixed(2)} / mês</span>
                </div>
                
                <div className="progress-section">
                  <div className="progress-labels">
                    <span>Progresso</span>
                    <span>{item.parcelaAtual} de {item.parcelas}</span>
                  </div>
                  <div className="progress-container">
                    <div 
                      className="progress-bar bg-primary" 
                      style={{ width: `${(Number(item.parcelaAtual) / Number(item.parcelas)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="card-footer-actions">
                  <button 
                    className="btn btn-ghost color-primary" 
                    onClick={() => handleIncrement(item)}
                    disabled={item.status === 'FINALIZADO'}
                  >
                    + 1 Parcela
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="empty-state">
                 Nenhum parcelamento ativo.
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Parcelamento">
        <form onSubmit={handleCreate} className="modal-form">
          <div className="form-group">
            <label className="label">Descrição do bem</label>
            <input type="text" name="descricao" placeholder="Ex: Notebook..." required />
          </div>
          <div className="grid-2-cols">
            <div className="form-group">
              <label className="label">Valor Total (R$)</label>
              <input type="number" name="custoTotal" step="0.01" required />
            </div>
            <div className="form-group">
              <label className="label">Parcelas</label>
              <input type="number" name="parcelas" min="1" required />
            </div>
          </div>

          <div className="modal-actions-stack">
            <button type="submit" className="btn btn-primary btn-full">Salvar</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-full">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
