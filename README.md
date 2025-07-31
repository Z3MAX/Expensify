# 🧾 Expensify Integration System

Sistema completo para integração com Expensify, permitindo upload em massa de despesas via arquivos Excel.

## 🌟 Funcionalidades

- 👥 **Gestão de Usuários**: Cadastro seguro com credenciais Expensify
- 📊 **Upload via Excel**: Processamento inteligente de planilhas
- 🚀 **Integração API**: Envio direto para Expensify
- 📱 **Interface Moderna**: Design responsivo e intuitivo  
- 🖥️ **App Desktop**: Versão Electron para Windows
- 📈 **Relatórios**: Histórico completo e estatísticas

## 🛠️ Tecnologias

### Backend
- **Python 3.9+** com Flask
- **SQLite** para dados locais
- **Pandas** para processamento Excel
- **JWT** para autenticação

### Frontend  
- **React 18** com Hooks
- **Tailwind CSS** para styling
- **Lucide React** para ícones

### Desktop
- **Electron** para app nativo

## 📋 Pré-requisitos

- Python 3.9+
- Node.js 18+
- Credenciais Expensify:
  - Partner User ID
  - Partner User Secret  
  - Policy ID

## 🚀 Instalação Rápida

```batch
# Execute o setup
scripts\setup.bat

# Ou manualmente:
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## 🎮 Como Usar

### Desenvolvimento
```batch
# Usar script automatico
scripts\run-dev.bat

# Ou manualmente:
# Terminal 1 - Backend
cd backend
venv\Scripts\activate
python app.py

# Terminal 2 - Frontend
cd frontend
npm start
```

### App Desktop
```batch
cd frontend
npm run electron-dev
```

### Build Produção
```batch
scripts\build.bat
```

## 📊 Formato Excel Esperado

O sistema processa automaticamente planilhas com estas colunas:

### Obrigatórias
- **Data** (dd.mm.yyyy ou yyyy-mm-dd)
- **Movimentação** (descrição/merchant)
- **Valor em BRL** (numérico)

### Opcionais  
- **Profissional** (nome do funcionário)
- **Valor em USD** (conversão automática)

### Exemplo
```
Profissional | Data       | Movimentação        | Valor em BRL
Jorge Jamil  | 05.06.2025 | ANTHROPIC: CLAUDE   | 128.52
Jorge Jamil  | 07.06.2025 | GOOGLE CLOUD        | 2340.00
```

## 🔒 Segurança

- 🔐 **Autenticação JWT** com tokens seguros
- 🛡️ **Hash de senhas** com Werkzeug
- 🗄️ **SQLite local** para dados sensíveis

## 📁 Estrutura do Projeto

```
expensify-integration/
├── backend/
│   ├── app.py              # API Flask principal
│   ├── requirements.txt    # Dependências Python
│   └── uploads/           # Arquivos temporários
├── frontend/
│   ├── src/
│   │   ├── App.js         # Componente React principal
│   │   └── ExpensifyIntegration.js
│   ├── public/            # Assets estáticos
│   ├── package.json       # Dependências Node.js
│   └── main.js           # Electron main process
├── scripts/              # Scripts auxiliares
└── docs/                # Documentação
```

## 👨‍💻 Autor

**Alexandre Amorim**
- Email: aamorim@integrationconsulting.com

## 📝 Licença

Este projeto está sob a licença MIT.

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
