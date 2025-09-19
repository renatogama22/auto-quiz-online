


# Guia de Deploy e Configuração - Auto-Quiz Online

## 1. Introdução

Este documento fornece um guia completo para fazer o deploy e configurar a aplicação **Auto-Quiz Online**. A aplicação consiste em um frontend (HTML, CSS, JS) e um backend (Node.js com WebSocket), que devem ser executados juntos.

O backend serve o frontend e gerencia toda a lógica do jogo em tempo real. Portanto, o deploy envolve a execução do servidor Node.js em uma plataforma de hospedagem e garantir que o frontend seja acessível publicamente.

## 2. Configuração Local

Antes de fazer o deploy, é altamente recomendável testar a aplicação em seu ambiente local para garantir que tudo está funcionando corretamente.

### 2.1. Pré-requisitos

- **Node.js**: Versão 16 ou superior. Você pode verificar sua versão com `node -v`.
- **npm** (Node Package Manager): Geralmente instalado com o Node.js.

### 2.2. Passos para Instalação

1.  **Clone o Repositório**: Obtenha os arquivos do projeto. Se você recebeu um arquivo zip, descompacte-o.

    ```bash
    git clone <url-do-repositorio>
    cd auto-quiz-online
    ```

2.  **Instale as Dependências**: O arquivo `package.json` lista todas as bibliotecas necessárias para o backend (`express`, `ws`, `cors`, etc.).

    ```bash
    npm install
    ```

3.  **Inicie o Servidor**: Este comando executa o arquivo `server.js`, que inicia o servidor web e o WebSocket.

    ```bash
    npm start
    ```

4.  **Acesse no Navegador**: Abra seu navegador e acesse `http://localhost:8080`. A aplicação deve carregar.

### 2.3. Testando a Funcionalidade

-   Abra uma janela do navegador e acesse `http://localhost:8080`. Clique em **"Criar Jogo"**. Você será levado para a tela de lobby do professor e um código de sala será exibido.
-   Abra uma **segunda janela** (ou uma aba anônima) e acesse `http://localhost:8080` novamente. Desta vez, clique em **"Entrar no Jogo"**.
-   Digite o código da sala e um nome de jogador. Você deverá ver o jogador aparecer na tela do professor.
-   Inicie o jogo na tela do professor e verifique se as perguntas são exibidas corretamente para ambos.

Se todos esses passos funcionarem, a aplicação está pronta para o deploy.




## 3. Opções de Deploy

Existem várias plataformas que facilitam o deploy de aplicações Node.js. Abaixo estão as instruções para algumas das mais populares e amigáveis para iniciantes.

### 3.1. Deploy na Railway

**Railway** é uma das plataformas mais simples para deploy, pois automatiza a maior parte do processo.

1.  **Crie uma Conta**: Acesse [railway.app](https://railway.app) e crie uma conta, preferencialmente vinculando seu perfil do GitHub.
2.  **Crie um Repositório no GitHub**: Envie o código do projeto para um novo repositório no GitHub.
3.  **Crie um Novo Projeto na Railway**:
    -   No seu dashboard da Railway, clique em "New Project".
    -   Selecione "Deploy from GitHub repo".
    -   Escolha o repositório do seu Auto-Quiz.
4.  **Configuração Automática**: A Railway detectará automaticamente o `package.json` e o `server.js`. Ela instalará as dependências (`npm install`) e usará o comando `npm start` para iniciar o servidor.
5.  **Variáveis de Ambiente**: A Railway expõe a variável `PORT` automaticamente. O `server.js` já está configurado para usar a porta fornecida pelo ambiente (`process.env.PORT`).
6.  **Domínio Público**: Após o deploy, a Railway fornecerá um domínio público no formato `https://<nome-do-projeto>.up.railway.app`. A aplicação estará online e pronta para uso.

### 3.2. Deploy no Render

**Render** é outra excelente opção, com um plano gratuito generoso e um processo de configuração claro.

1.  **Crie uma Conta**: Acesse [render.com](https://render.com) e crie uma conta, vinculando seu GitHub.
2.  **Crie um Repositório no GitHub**: Assim como na Railway, seu código precisa estar em um repositório GitHub.
3.  **Crie um Novo "Web Service"**:
    -   No dashboard do Render, clique em "New +" e selecione "Web Service".
    -   Conecte seu repositório GitHub e selecione o repositório do Auto-Quiz.
4.  **Configurações de Deploy**:
    -   **Name**: Dê um nome ao seu serviço (ex: `auto-quiz-online`).
    -   **Region**: Escolha a região mais próxima de você.
    -   **Branch**: `main` (ou a branch principal do seu repositório).
    -   **Runtime**: `Node`.
    -   **Build Command**: `npm install`.
    -   **Start Command**: `npm start`.
5.  **Plano Gratuito**: Selecione o plano "Free".
6.  **Deploy**: Clique em "Create Web Service". O Render fará o build e o deploy da sua aplicação. O processo pode levar alguns minutos.
7.  **Domínio Público**: O Render fornecerá uma URL pública no formato `https://<nome-do-servico>.onrender.com`.

### 3.3. Deploy no Heroku

**Heroku** é uma plataforma clássica para deploy de aplicações, embora seu plano gratuito tenha sido descontinuado. Requer o uso do Heroku CLI (Command Line Interface).

1.  **Crie uma Conta**: Acesse [heroku.com](https://heroku.com) e crie uma conta.
2.  **Instale o Heroku CLI**: Siga as instruções em [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli).
3.  **Faça Login pelo Terminal**:

    ```bash
    heroku login
    ```

4.  **Crie o App no Heroku**: Navegue até a pasta do seu projeto no terminal e execute:

    ```bash
    heroku create seu-app-auto-quiz
    ```

    Isso criará um novo app no Heroku e adicionará um `remote` do Git chamado `heroku`.

5.  **Envie o Código para o Heroku**:

    ```bash
    git push heroku main
    ```

    O Heroku detectará que é uma aplicação Node.js, instalará as dependências e iniciará o servidor.

6.  **Acesse a Aplicação**: Após o deploy, você pode abrir a aplicação com:

    ```bash
    heroku open
    ```

## 4. Estrutura do Projeto

```
/auto-quiz-online
├── /public
│   └── index.html      # O frontend otimizado da aplicação
├── .gitignore          # Arquivos e pastas a serem ignorados pelo Git
├── DEPLOY.md           # Este guia de deploy
├── package.json        # Define os scripts e dependências do Node.js
├── package-lock.json   # Gerado pelo npm, trava as versões das dependências
├── README.md           # Documentação geral do projeto
└── server.js           # O coração do backend (servidor Express + WebSocket)
```

## 5. Solução de Problemas Comuns (Troubleshooting)

-   **Erro de Conexão WebSocket**: Verifique o console do navegador. Se houver um erro `wss://... failed`, pode ser um problema com a configuração de proxy ou SSL na plataforma de deploy. Railway e Render geralmente lidam com isso automaticamente.
-   **Aplicação não Inicia (Application Error)**: Verifique os logs do servidor na sua plataforma de hospedagem (Railway, Render, Heroku). O erro mais comum é uma dependência faltando ou um erro de sintaxe no `server.js`.
-   **O Jogo não Funciona como Esperado**: Teste localmente primeiro. Se funcionar localmente mas não online, o problema provavelmente está relacionado à comunicação WebSocket em um ambiente de produção.

Com este guia, você deve ser capaz de colocar o Auto-Quiz online e disponível para todos!

