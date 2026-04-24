import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader/PageHeader';
import { Modal } from '../../components/ui/Modal/Modal';
import { CustomDropdown } from '../../components/ui/CustomDropdown/CustomDropdown';
import { StorageService, KEYS } from '../../services/StorageService';
import { Transaction, Category, Card } from '../../types';
import './GenericList.css';

interface GenericListProps {
  title: string;
  storageKey: string;
}

export const GenericList: React.FC<GenericListProps> = ({ title, storageKey }) => {
  const { setIsSidebarVisible } = useOutletContext<{ setIsSidebarVisible: (v: boolean) => void }>();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    descricao: '',
    nome: '',
    valor: '',
    data: '',
    categoria: '',
    formaPagamento: '',
    cartao: ''
  });

  const isSpecial = storageKey === KEYS.CATEGORIAS || storageKey === KEYS.CARTOES;
  const isAvulsa = storageKey === KEYS.COMPRAS_AVULSAS;

  const fetchData = async () => {
    setLoading(true);
    const [resItems, resCats, resCards] = await Promise.all([
      StorageService.getAll(storageKey),
      StorageService.getAll(KEYS.CATEGORIAS),
      StorageService.getAll(KEYS.CARTOES)
    ]);
    setItems(resItems);
    setCategories(resCats);
    setCards(resCards);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [storageKey]);

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        descricao: item.descricao || '',
        nome: item.nome || '',
        valor: item.valor || item.valorMensal || '',
        data: item.data || '',
        categoria: item.categoria || '',
        formaPagamento: item.formaPagamento || '',
        cartao: item.cartao || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        descricao: '',
        nome: '',
        valor: '',
        data: '',
        categoria: '',
        formaPagamento: '',
        cartao: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = isSpecial ? { nome: formData.nome } : {
      descricao: formData.descricao,
      valor: Number(formData.valor),
      valorMensal: Number(formData.valor),
      data: formData.data,
      categoria: formData.categoria,
      formaPagamento: formData.formaPagamento,
      cartao: formData.cartao,
      status: 'PENDENTE'
    };

    if (editingItem) {
      await StorageService.update(storageKey, { ...editingItem, ...data });
    } else {
      await StorageService.add(storageKey, { id: crypto.randomUUID(), ...data });
    }

    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (idToDelete) {
      await StorageService.remove(storageKey, idToDelete);
      setIsConfirmOpen(false);
      setIdToDelete(null);
      fetchData();
    }
  };

  const getMonthName = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month] = dateStr.split('-');
    const date = new Date(Number(year), parseInt(month) - 1);
    return date.toLocaleString('pt-BR', { month: 'long' }).charAt(0).toUpperCase() + date.toLocaleString('pt-BR', { month: 'long' }).slice(1);
  };

  return (
    <div className="generic-list-page">
      <PageHeader 
        breadcrumb="Gestão" 
        current={title} 
        onMenuClick={() => setIsSidebarVisible(true)}
        actions={
          <button className="btn btn-primary desktop-only" onClick={() => handleOpenModal()}>
            <Plus size={16} /> Adicionar {isSpecial ? 'Novo' : 'Registro'}
          </button>
        }
      />

      <div className="content-padding">
        <button className="btn btn-primary mobile-fab mobile-only" onClick={() => handleOpenModal()}>
          <Plus size={28} />
        </button>

        {loading ? (
          <div className="loading">Carregando dados...</div>
        ) : (
          <>
            {/* Desktop Table */}
            <section className="table-container desktop-only">
              <table>
                <thead>
                  <tr>
                    {isSpecial ? <th>Nome</th> : (
                      <>
                        {isAvulsa && <th>Ano</th>}
                        {isAvulsa && <th>Mês</th>}
                        <th>Descrição</th>
                        <th className="text-right">Valor</th>
                        <th>Categoria</th>
                        <th>Pagamento</th>
                        <th>Cartão</th>
                      </>
                    )}
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      {isSpecial ? <td className="font-bold">{item.nome}</td> : (
                        <>
                          {isAvulsa && <td>{item.data?.split('-')[0] || '-'}</td>}
                          {isAvulsa && <td>{getMonthName(item.data)}</td>}
                          <td className="font-bold">{item.descricao}</td>
                          <td className="text-right font-bold">R$ {Number(item.valor || item.valorMensal).toFixed(2)}</td>
                          <td>{item.categoria || '-'}</td>
                          <td>{item.formaPagamento || '-'}</td>
                          <td>{item.cartao || '-'}</td>
                        </>
                      )}
                      <td className="text-right">
                        <div className="actions-cell">
                          <button className="btn btn-ghost color-primary" onClick={() => handleOpenModal(item)}>
                            <Edit3 size={18} />
                          </button>
                          <button className="btn btn-danger" onClick={() => { setIdToDelete(item.id); setIsConfirmOpen(true); }}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Mobile Cards */}
            <section className="mobile-list">
              {items.map(item => (
                <div key={item.id} className="card generic-card">
                  <div className="card-top">
                    <div className="card-titles">
                      <h4 className="item-name">{item.nome || item.descricao}</h4>
                      <p className="item-sub">
                        {isAvulsa && item.data ? `${getMonthName(item.data)} / ${item.data.split('-')[0]}` : title}
                      </p>
                    </div>
                    {!isSpecial && (
                      <p className="item-val">R$ {Number(item.valor || item.valorMensal).toFixed(2)}</p>
                    )}
                  </div>
                  <div className="card-bottom">
                    <div className="card-actions">
                       <button className="btn btn-ghost color-primary" onClick={() => handleOpenModal(item)}>
                          <Edit3 size={18} />
                       </button>
                       <button className="btn btn-danger" onClick={() => { setIdToDelete(item.id); setIsConfirmOpen(true); }}>
                          <Trash2 size={18} />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Registro' : 'Novo Registro'}>
        <form onSubmit={handleSave} className="modal-form">
          {isSpecial ? (
            <div className="form-group">
              <label className="label">Nome</label>
              <input 
                type="text" 
                value={formData.nome} 
                onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} 
                required 
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="label">Descrição</label>
                <input 
                  type="text" 
                  value={formData.descricao} 
                  onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))} 
                  required 
                />
              </div>
              <div className="grid-2-cols">
                <div className="form-group">
                  <label className="label">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.valor} 
                    onChange={e => setFormData(p => ({ ...p, valor: e.target.value }))} 
                    required 
                  />
                </div>
                {isAvulsa && (
                  <div className="form-group">
                    <label className="label">Data</label>
                    <input 
                      type="date" 
                      value={formData.data} 
                      onChange={e => setFormData(p => ({ ...p, data: e.target.value }))} 
                      required 
                    />
                  </div>
                )}
              </div>
              
              <CustomDropdown 
                label="Categoria"
                options={categories.map(c => ({ id: c.nome, label: c.nome }))}
                selectedValues={formData.categoria ? [formData.categoria] : []}
                onChange={vals => setFormData(p => ({ ...p, categoria: vals[0] || '' }))}
              />
              
              <div className="grid-2-cols">
                <CustomDropdown 
                  label="Pagamento"
                  options={[
                    { id: 'Pix', label: 'Pix' },
                    { id: 'Débito', label: 'Débito' },
                    { id: 'Crédito', label: 'Crédito' },
                    { id: 'Boleto', label: 'Boleto' }
                  ]}
                  selectedValues={formData.formaPagamento ? [formData.formaPagamento] : []}
                  onChange={vals => setFormData(p => ({ ...p, formaPagamento: vals[0] || '' }))}
                />
                <CustomDropdown 
                  label="Cartão"
                  options={cards.map(c => ({ id: c.nome, label: c.nome }))}
                  selectedValues={formData.cartao ? [formData.cartao] : []}
                  onChange={vals => setFormData(p => ({ ...p, cartao: vals[0] || '' }))}
                />
              </div>
            </>
          )}

          <div className="modal-actions-stack">
            <button type="submit" className="btn btn-primary btn-full">Salvar</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-full">Cancelar</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirmar Exclusão">
        <div className="confirm-content">
          <div className="confirm-icon"><AlertTriangle size={32} /></div>
          <p>Deseja realmente excluir este item? Esta ação é irreversível.</p>
          <div className="modal-actions-stack">
            <button className="btn btn-danger btn-full" onClick={handleDelete}>Sim, Excluir</button>
            <button className="btn btn-ghost btn-full" onClick={() => setIsConfirmOpen(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
