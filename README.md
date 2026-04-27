# 💰 Finanças Pro

Aplicação web de **controle de finanças pessoais**, desenvolvida em React + TypeScript com backend em Firebase. Permite acompanhar despesas mensais por categoria, forma de pagamento e cartão, com suporte a dívidas fixas, parcelamentos e compras avulsas.

---

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Fluxo de Uso](#-fluxo-de-uso)
- [Como Rodar Localmente](#-como-rodar-localmente)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Segurança](#-segurança)
- [Deploy](#-deploy)

---

## ✨ Funcionalidades

- 🔐 **Autenticação** via Google (Firebase Auth)
- 📊 **Dashboard mensal** com totais de gastos por categoria
- 🗓️ **Dívidas Fixas** — despesas recorrentes que aparecem todo mês automaticamente
- 💳 **Parcelamentos** — controle de compras parceladas com rastreamento de parcela atual e data de conclusão
- 🛍️ **Compras Avulsas** — gastos pontuais vinculados a uma data específica
- 🏷️ **Categorias e Cartões** — cadastros de apoio para classificar as transações
- ✅ **Marcar como Pago / Estornar** — controle de status de cada lançamento no mês
- 🔍 **Filtros avançados** — filtre por mês, ano, categoria, forma de pagamento, cartão e status
- 📱 **Layout responsivo** — tabelas no desktop, cards no mobile com Bottom Sheet

---

## 🛠 Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Bundler | [Vite 6](https://vitejs.dev/) |
| Roteamento | [React Router DOM v7](https://reactrouter.com/) |
| Backend / Banco | [Firebase](https://firebase.google.com/) (Firestore + Auth) |
| Ícones | [Lucide React](https://lucide.dev/) |
| Animações | [Framer Motion](https://www.framer.com/motion/) |
| Estilização | CSS puro com variáveis CSS |

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── Layout/          # Layout principal com sidebar
│   ├── Sidebar/         # Navegação lateral (expansível no desktop, gaveta no mobile)
│   └── ui/
│       ├── CustomDropdown/  # Dropdown com suporte a seleção múltipla
│       ├── Modal/           # Modal / Bottom Sheet (desktop e mobile)
│       └── PageHeader/      # Cabeçalho de página com breadcrumb e ações
├── contexts/
│   └── AuthContext.tsx      # Contexto de autenticação (usuário, login, logout)
├── pages/
│   ├── Dashboard/       # Tela principal — resumo e lançamentos do mês
│   ├── GenericList/     # Lista reutilizável (Dívidas Fixas e Compras Avulsas)
│   ├── Installments/    # Gerenciamento de parcelamentos
│   └── Login/           # Tela de login com Google
├── services/
│   ├── firebase.ts          # Inicialização do Firebase (Auth + Firestore)
│   ├── FirebaseService.ts   # CRUD + listeners em tempo real (onSnapshot)
│   ├── StorageService.ts    # Fachada de acesso a dados
│   └── DashboardService.ts  # Lógica de negócio: resumos mensais e parcelas virtuais
├── types.ts                 # Tipos TypeScript globais (Transaction, Category, Card...)
├── App.tsx                  # Roteamento principal e proteção de rotas
└── index.css                # Design system global (variáveis, botões, tabelas, forms)
```

---

## 🔄 Fluxo de Uso

### 1. Primeiro acesso
O usuário faz login com sua conta Google. Todos os dados são isolados por usuário — cada um vê apenas o que cadastrou.

### 2. Configuração inicial *(feito uma vez)*
Antes de usar de verdade, cadastre os dados de apoio:
- **Sidebar → Categorias**: "Alimentação", "Moradia", "Transporte"...
- **Sidebar → Meus Cartões**: "Nubank", "Inter", "C6"...

Esses itens alimentam os dropdowns dos formulários.

### 3. Cadastro de despesas
| Seção | O que cadastrar | Comportamento no Dashboard |
|---|---|---|
| **Dívidas Fixas** | Aluguel, assinatura, plano de saúde | Aparece **todo mês** automaticamente |
| **Parcelamentos** | Custo total + nº de parcelas + data da compra | Aparece apenas nos **meses com parcela ativa** |
| **Compras Avulsas** | Valor + data específica | Aparece **somente no mês da data** |

### 4. Acompanhamento mensal *(uso diário)*
1. Abrir o Dashboard — já carrega o mês atual
2. Ver os totais: **Geral / Fixas / Parcelamentos / Avulsas**
3. Conferir a tabela de transações do período
4. À medida que pagar as contas, clicar em **✓ Pagar** para marcar como pago
5. Clicar em **↩ Estornar** se precisar desfazer

> O Dashboard suporta seleção de **múltiplos meses** para visões consolidadas (ex: 1º trimestre).

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) v18 ou superior

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Configurar as variáveis de ambiente!
# Copie o conteúdo do .env e preencha com suas credenciais

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

O app estará disponível em **`http://localhost:3000`**

### Outros comandos

```bash
npm run build    # Gera o bundle de produção em /dist
npm run preview  # Pré-visualiza o build de produção localmente
npm run lint     # Verifica erros de tipagem TypeScript
```

---

### Boas práticas adotadas

- ✅ Todas as queries filtram por `userId` no servidor
- ✅ Autenticação obrigatória para acessar qualquer rota

---

## ☁️ Deploy

O app pode ser publicado gratuitamente em diversas plataformas. Após o build (`npm run build`), a pasta `/dist` contém o app estático pronto para deploy.

---

## 📄 Licença

Projeto de uso pessoal.
