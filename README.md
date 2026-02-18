<div align="center">

# Tech Wishlist

**Organize suas tecnologias de estudo com prioridades personalizadas**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.19-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.96.0-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

</div>

---

## Sobre o Projeto

**Tech Wishlist** é uma aplicação moderna e intuitiva desenvolvida em React para ajudar desenvolvedores a organizarem suas metas de aprendizado tecnológico. Com ela, você pode criar uma lista personalizada de tecnologias que deseja aprender, definir níveis de prioridade e acompanhar seu progresso de forma visual e eficiente.

### Características Principais

- **Interface Moderna**: Design responsivo e elegante com Tailwind CSS
- **Persistência de Dados**: Integração completa com Supabase para armazenamento em nuvem
- **Performance Otimizada**: Construído com Vite para desenvolvimento rápido e builds eficientes
- **Responsivo**: Funciona perfeitamente em dispositivos móveis e desktop
- **Priorização**: Sistema de níveis de prioridade para organizar seus estudos
- **Código Limpo**: Implementação seguindo as melhores práticas do React 19

- **Deploy**: (em breve)

---

## Começando

### 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Conta no [Supabase](https://supabase.com/) (gratuita)

### Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/bia-bez/Tech-Wishlist.git
   cd Tech-Wishlist
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   Crie um arquivo `.env` na raiz do projeto e adicione suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**
   
   Abra seu navegador em [http://localhost:5173](http://localhost:5173)

---

## 📁 Estrutura do Projeto

```
Tech-Wishlist/
├── public/              # Arquivos estáticos
├── src/
│   ├── assets/          # Imagens, ícones e recursos
│   ├── components/      # Componentes React reutilizáveis
│   ├── App.jsx          # Componente principal
│   ├── App.css          # Estilos do componente principal
│   ├── main.jsx         # Ponto de entrada da aplicação
│   ├── index.css        # Estilos globais
│   └── supabaseClient.js # Configuração do cliente Supabase
├── index.html           # Template HTML
├── package.json         # Dependências e scripts
├── vite.config.js       # Configuração do Vite
├── tailwind.config.js   # Configuração do Tailwind CSS
├── postcss.config.js    # Configuração do PostCSS
└── eslint.config.js     # Configuração do ESLint
```

---

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Cria a build de produção |
| `npm run preview` | Visualiza a build de produção localmente |
| `npm run lint` | Executa o ESLint para verificar problemas no código |

---

## Tecnologias Utilizadas

### Core
- **[React 19.2.0](https://reactjs.org/)** - Biblioteca JavaScript para construção de interfaces
- **[Vite 7.3.1](https://vitejs.dev/)** - Build tool moderna e extremamente rápida
- **[Supabase 2.96.0](https://supabase.com/)** - Backend as a Service (BaaS) para banco de dados e autenticação

### Estilização
- **[Tailwind CSS 3.4.19](https://tailwindcss.com/)** - Framework CSS utility-first
- **[PostCSS 8.5.6](https://postcss.org/)** - Ferramenta para transformar CSS
- **[Autoprefixer 10.4.24](https://github.com/postcss/autoprefixer)** - Plugin para adicionar prefixos CSS automaticamente

### Qualidade de Código
- **[ESLint 9.39.1](https://eslint.org/)** - Linter para JavaScript/React
- **[eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)** - Regras do ESLint para React Hooks
- **[eslint-plugin-react-refresh](https://www.npmjs.com/package/eslint-plugin-react-refresh)** - Plugin para React Fast Refresh

---

## Funcionalidades

- ✅ Adicionar tecnologias à lista de desejos
- ✅ Definir níveis de prioridade (Alta, Média, Baixa)
- ✅ Editar e remover itens da lista
- ✅ Sincronização automática com Supabase
- ✅ Interface responsiva e intuitiva
- ✅ Validação de dados em tempo real

---


## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## Autor

**bia-bez**

- GitHub: [@bia-bez](https://github.com/bia-bez)

---

## Agradecimentos

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

<div align="center">


Made with ❤️ by [bia-bez](https://github.com/bia-bez)

</div>
