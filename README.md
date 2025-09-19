# 🚗 Auto-Quiz Online

Um jogo educativo em tempo real sobre legislação de trânsito, desenvolvido para ajudar estudantes a se prepararem para a prova teórica do DETRAN.

## 🎮 Características

- **Tempo Real**: Jogo multiplayer com WebSocket
- **Responsivo**: Funciona perfeitamente em desktop e mobile
- **Acessível**: Suporte completo a leitores de tela e navegação por teclado
- **Educativo**: 15+ perguntas sobre legislação de trânsito
- **Gamificado**: Sistema de pontuação baseado em velocidade e precisão

## 🚀 Como Usar

### Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn

### Instalação Local

1. Clone ou baixe o projeto
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor:
   ```bash
   npm start
   ```

4. Acesse no navegador: `http://localhost:8080`

### Para Desenvolvimento

```bash
npm run dev
```

Isso iniciará o servidor com auto-reload usando nodemon.

## 🎯 Como Jogar

### Para Professores (Host)
1. Clique em "Criar Jogo"
2. Compartilhe o código de 6 dígitos com os alunos
3. Aguarde os jogadores entrarem
4. Clique em "Iniciar Jogo"
5. Avance pelas perguntas conforme necessário

### Para Alunos (Jogadores)
1. Clique em "Entrar no Jogo"
2. Digite o código fornecido pelo professor
3. Insira seu nome
4. Responda as perguntas o mais rápido possível
5. Veja sua pontuação no placar!

## 🏗️ Arquitetura

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js com WebSocket (ws)
- **Estilo**: Tailwind CSS
- **Comunicação**: WebSocket para tempo real

## 📱 Recursos de Acessibilidade

- Navegação completa por teclado
- Suporte a leitores de tela
- Contraste adequado (WCAG 2.1 AA)
- Respeito à preferência de movimento reduzido
- Feedback tátil em dispositivos móveis

## 🌐 Deploy

### Heroku
1. Crie uma conta no Heroku
2. Instale o Heroku CLI
3. Execute:
   ```bash
   heroku create seu-app-name
   git push heroku main
   ```

### Railway
1. Conecte seu repositório GitHub
2. O deploy é automático

### Render
1. Conecte seu repositório GitHub
2. Configure o comando de build: `npm install`
3. Configure o comando de start: `npm start`

## 🔧 Configuração

O servidor usa as seguintes variáveis de ambiente:

- `PORT`: Porta do servidor (padrão: 8080)

## 📊 Banco de Perguntas

O jogo inclui 15 perguntas sobre:
- Velocidades permitidas
- Sinalização de trânsito
- Pontuação na CNH
- Regras de estacionamento
- Procedimentos de segurança

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique se o Node.js está instalado corretamente
2. Certifique-se de que a porta 8080 está disponível
3. Verifique o console do navegador para erros
4. Teste a conexão WebSocket

## 🎨 Personalização

Para adicionar novas perguntas, edite o array `questionBank` no arquivo `server.js`.

Para alterar o visual, modifique as variáveis CSS no arquivo `public/index.html`.

---

Desenvolvido com ❤️ para educação no trânsito

