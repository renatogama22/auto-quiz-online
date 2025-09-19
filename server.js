const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configuração do servidor
const PORT = process.env.PORT || 8080;
const app = express();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Servir o arquivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Criar servidor HTTP
const server = require('http').createServer(app);

// Criar servidor WebSocket
const wss = new WebSocket.Server({ server });

// Estruturas de dados do jogo
const games = new Map(); // gameCode -> Game
const clients = new Map(); // ws -> ClientInfo

// Banco de perguntas sobre trânsito
const questionBank = [
    {
        question: "Qual é a velocidade máxima permitida em vias urbanas no Brasil?",
        answers: ["40 km/h", "50 km/h", "60 km/h", "70 km/h"],
        correct: 2
    },
    {
        question: "O que significa a placa de trânsito com fundo azul e símbolo branco?",
        answers: ["Proibição", "Advertência", "Regulamentação", "Indicação"],
        correct: 3
    },
    {
        question: "Quantos pontos na CNH resulta em suspensão do direito de dirigir?",
        answers: ["15 pontos", "20 pontos", "25 pontos", "30 pontos"],
        correct: 1
    },
    {
        question: "Qual é a distância mínima para estacionar antes de uma esquina?",
        answers: ["3 metros", "5 metros", "8 metros", "10 metros"],
        correct: 1
    },
    {
        question: "O que deve fazer ao se aproximar de um cruzamento com semáforo amarelo?",
        answers: ["Acelerar para passar", "Parar se possível", "Buzinar", "Ignorar"],
        correct: 1
    },
    {
        question: "Qual é a idade mínima para obter a CNH categoria B?",
        answers: ["16 anos", "17 anos", "18 anos", "21 anos"],
        correct: 2
    },
    {
        question: "O que significa a faixa amarela contínua no meio da pista?",
        answers: ["Pode ultrapassar", "Proibido ultrapassar", "Atenção", "Estacionamento"],
        correct: 1
    },
    {
        question: "Qual é o prazo para renovar a CNH após o vencimento?",
        answers: ["30 dias", "60 dias", "90 dias", "1 ano"],
        correct: 0
    },
    {
        question: "Em uma rotatória, quem tem preferência?",
        answers: ["Quem entra", "Quem está dentro", "O maior veículo", "Não há preferência"],
        correct: 1
    },
    {
        question: "Qual é a multa por dirigir sem CNH?",
        answers: ["Leve", "Média", "Grave", "Gravíssima"],
        correct: 3
    },
    {
        question: "O que é obrigatório usar durante a condução noturna?",
        answers: ["Farol baixo", "Farol alto", "Pisca-alerta", "Lanterna"],
        correct: 0
    },
    {
        question: "Qual é a velocidade máxima em rodovias de pista dupla?",
        answers: ["100 km/h", "110 km/h", "120 km/h", "130 km/h"],
        correct: 1
    },
    {
        question: "O que significa a placa R-1?",
        answers: ["Pare", "Dê a preferência", "Proibido virar à esquerda", "Sentido proibido"],
        correct: 0
    },
    {
        question: "Qual é o tempo mínimo de habilitação para conduzir profissionalmente?",
        answers: ["1 ano", "2 anos", "3 anos", "5 anos"],
        correct: 1
    },
    {
        question: "O que deve fazer ao avistar uma ambulância com sirene ligada?",
        answers: ["Acelerar", "Dar passagem", "Parar no meio da via", "Ignorar"],
        correct: 1
    }
];

// Classe para representar um jogo
class Game {
    constructor(gameCode) {
        this.gameCode = gameCode;
        this.host = null;
        this.players = new Map(); // ws -> playerName
        this.state = 'lobby'; // lobby, question, leaderboard, finished
        this.currentQuestion = 0;
        this.questions = this.selectRandomQuestions(10);
        this.scores = new Map(); // playerName -> score
        this.answers = new Map(); // ws -> answerIndex
        this.questionStartTime = null;
        this.questionTimer = null;
    }

    selectRandomQuestions(count) {
        const shuffled = [...questionBank].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    addPlayer(ws, name) {
        if (this.state !== 'lobby') {
            return { success: false, error: 'O jogo já começou' };
        }

        // Verificar se o nome já existe
        const existingNames = Array.from(this.players.values());
        if (existingNames.includes(name)) {
            return { success: false, error: 'Este nome já está sendo usado' };
        }

        this.players.set(ws, name);
        this.scores.set(name, 0);
        return { success: true };
    }

    removePlayer(ws) {
        const playerName = this.players.get(ws);
        if (playerName) {
            this.players.delete(ws);
            this.scores.delete(playerName);
            this.answers.delete(ws);
        }
        return playerName;
    }

    getPlayerList() {
        return Array.from(this.players.values());
    }

    getLeaderboard() {
        const leaderboard = Array.from(this.scores.entries())
            .map(([name, score]) => ({ name, score }))
            .sort((a, b) => b.score - a.score);
        return leaderboard;
    }

    startGame() {
        if (this.players.size === 0) {
            return { success: false, error: 'Não há jogadores na sala' };
        }
        
        this.state = 'question';
        this.currentQuestion = 0;
        this.showLeaderboard();
        return { success: true };
    }

    showLeaderboard() {
        const leaderboard = this.getLeaderboard();
        const isLastQuestion = this.currentQuestion >= this.questions.length;
        
        // Enviar para o host
        if (this.host && this.host.readyState === WebSocket.OPEN) {
            this.host.send(JSON.stringify({
                type: 'leaderboardUpdate',
                payload: { leaderboard, isLastQuestion }
            }));
        }

        // Enviar para os jogadores
        this.players.forEach((playerName, ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'leaderboardUpdate',
                    payload: { leaderboard, isLastQuestion }
                }));
            }
        });

        // Se foi a última pergunta, finalizar o jogo
        if (isLastQuestion) {
            setTimeout(() => this.endGame(), 5000);
        }
    }

    nextQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.endGame();
            return;
        }

        this.state = 'question';
        this.answers.clear();
        
        const question = this.questions[this.currentQuestion];
        this.questionStartTime = Date.now();
        
        // Enviar pergunta para o host
        if (this.host && this.host.readyState === WebSocket.OPEN) {
            this.host.send(JSON.stringify({
                type: 'newQuestion',
                payload: {
                    question,
                    qNum: this.currentQuestion + 1,
                    total: this.questions.length,
                    startTime: this.questionStartTime
                }
            }));
        }

        // Enviar pergunta para os jogadores
        this.players.forEach((playerName, ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'newQuestion',
                    payload: {
                        question,
                        startTime: this.questionStartTime
                    }
                }));
            }
        });

        // Timer da pergunta (30 segundos)
        this.questionTimer = setTimeout(() => {
            this.processAnswers();
        }, 30000);
    }

    submitAnswer(ws, answerIndex) {
        if (this.state !== 'question') {
            return { success: false, error: 'Não há pergunta ativa' };
        }

        if (this.answers.has(ws)) {
            return { success: false, error: 'Você já respondeu esta pergunta' };
        }

        this.answers.set(ws, {
            answerIndex,
            timestamp: Date.now()
        });

        // Se todos responderam, processar imediatamente
        if (this.answers.size === this.players.size) {
            clearTimeout(this.questionTimer);
            this.processAnswers();
        }

        return { success: true };
    }

    processAnswers() {
        const question = this.questions[this.currentQuestion];
        const correctAnswer = question.correct;

        // Calcular pontuações
        this.answers.forEach((answer, ws) => {
            const playerName = this.players.get(ws);
            if (!playerName) return;

            const isCorrect = answer.answerIndex === correctAnswer;
            let points = 0;

            if (isCorrect) {
                // Pontuação baseada na velocidade (máximo 1000 pontos)
                const timeElapsed = answer.timestamp - this.questionStartTime;
                const timeBonus = Math.max(0, 30000 - timeElapsed) / 30000; // 0 a 1
                points = Math.round(500 + (500 * timeBonus)); // 500 a 1000 pontos
            }

            const currentScore = this.scores.get(playerName) || 0;
            this.scores.set(playerName, currentScore + points);

            // Enviar resultado individual para o jogador
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'answerResult',
                    payload: {
                        correct: isCorrect,
                        score: this.scores.get(playerName),
                        points: points
                    }
                }));
            }
        });

        this.currentQuestion++;
        this.state = 'leaderboard';

        // Mostrar leaderboard após 2 segundos
        setTimeout(() => {
            this.showLeaderboard();
        }, 2000);
    }

    endGame() {
        this.state = 'finished';
        const finalLeaderboard = this.getLeaderboard();

        // Enviar resultado final para todos
        const message = JSON.stringify({
            type: 'gameOver',
            payload: { leaderboard: finalLeaderboard }
        });

        if (this.host && this.host.readyState === WebSocket.OPEN) {
            this.host.send(message);
        }

        this.players.forEach((playerName, ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    cleanup() {
        if (this.questionTimer) {
            clearTimeout(this.questionTimer);
        }
    }
}

// Função para gerar código de jogo único
function generateGameCode() {
    let code;
    do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (games.has(code));
    return code;
}

// Função para broadcast para todos os clientes de um jogo
function broadcastToGame(game, message, excludeWs = null) {
    const messageStr = JSON.stringify(message);
    
    if (game.host && game.host !== excludeWs && game.host.readyState === WebSocket.OPEN) {
        game.host.send(messageStr);
    }
    
    game.players.forEach((playerName, ws) => {
        if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
        }
    });
}

// Manipulador de conexões WebSocket
wss.on('connection', (ws) => {
    console.log('Nova conexão WebSocket estabelecida');
    
    // Armazenar informações do cliente
    clients.set(ws, {
        role: null,
        gameCode: null,
        playerName: null
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(ws, message);
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            ws.send(JSON.stringify({
                type: 'error',
                payload: { error: 'Mensagem inválida' }
            }));
        }
    });

    ws.on('close', () => {
        console.log('Conexão WebSocket fechada');
        handleDisconnection(ws);
    });

    ws.on('error', (error) => {
        console.error('Erro na conexão WebSocket:', error);
        handleDisconnection(ws);
    });
});

// Manipulador de mensagens
function handleMessage(ws, message) {
    const { type, payload } = message;
    const clientInfo = clients.get(ws);

    switch (type) {
        case 'createGame':
            handleCreateGame(ws);
            break;
            
        case 'joinGame':
            handleJoinGame(ws, payload);
            break;
            
        case 'startGame':
            handleStartGame(ws);
            break;
            
        case 'nextQuestion':
            handleNextQuestion(ws);
            break;
            
        case 'submitAnswer':
            handleSubmitAnswer(ws, payload);
            break;
            
        default:
            ws.send(JSON.stringify({
                type: 'error',
                payload: { error: 'Tipo de mensagem desconhecido' }
            }));
    }
}

// Criar jogo
function handleCreateGame(ws) {
    const gameCode = generateGameCode();
    const game = new Game(gameCode);
    
    game.host = ws;
    games.set(gameCode, game);
    
    const clientInfo = clients.get(ws);
    clientInfo.role = 'host';
    clientInfo.gameCode = gameCode;
    
    ws.send(JSON.stringify({
        type: 'gameCreated',
        payload: { gameCode }
    }));
    
    console.log(`Jogo criado: ${gameCode}`);
}

// Entrar no jogo
function handleJoinGame(ws, payload) {
    const { gameCode, name } = payload;
    
    if (!gameCode || !name) {
        ws.send(JSON.stringify({
            type: 'joinError',
            payload: { error: 'Código do jogo e nome são obrigatórios' }
        }));
        return;
    }
    
    const game = games.get(gameCode);
    if (!game) {
        ws.send(JSON.stringify({
            type: 'joinError',
            payload: { error: 'Jogo não encontrado' }
        }));
        return;
    }
    
    const result = game.addPlayer(ws, name.trim());
    if (!result.success) {
        ws.send(JSON.stringify({
            type: 'joinError',
            payload: { error: result.error }
        }));
        return;
    }
    
    const clientInfo = clients.get(ws);
    clientInfo.role = 'player';
    clientInfo.gameCode = gameCode;
    clientInfo.playerName = name.trim();
    
    ws.send(JSON.stringify({
        type: 'joinSuccess',
        payload: { name: name.trim() }
    }));
    
    // Atualizar lista de jogadores para o host
    updatePlayerList(game);
    
    console.log(`Jogador ${name} entrou no jogo ${gameCode}`);
}

// Iniciar jogo
function handleStartGame(ws) {
    const clientInfo = clients.get(ws);
    if (clientInfo.role !== 'host') {
        ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Apenas o host pode iniciar o jogo' }
        }));
        return;
    }
    
    const game = games.get(clientInfo.gameCode);
    if (!game) {
        ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Jogo não encontrado' }
        }));
        return;
    }
    
    const result = game.startGame();
    if (!result.success) {
        ws.send(JSON.stringify({
            type: 'error',
            payload: { error: result.error }
        }));
        return;
    }
    
    console.log(`Jogo ${clientInfo.gameCode} iniciado`);
}

// Próxima pergunta
function handleNextQuestion(ws) {
    const clientInfo = clients.get(ws);
    if (clientInfo.role !== 'host') {
        ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Apenas o host pode avançar perguntas' }
        }));
        return;
    }
    
    const game = games.get(clientInfo.gameCode);
    if (!game) {
        ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Jogo não encontrado' }
        }));
        return;
    }
    
    game.nextQuestion();
}

// Enviar resposta
function handleSubmitAnswer(ws, payload) {
    const { answerIndex } = payload;
    const clientInfo = clients.get(ws);
    
    if (clientInfo.role !== 'player') {
        ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Apenas jogadores podem enviar respostas' }
        }));
        return;
    }
    
    const game = games.get(clientInfo.gameCode);
    if (!game) {
        ws.send(JSON.stringify({
            type: 'error',
            payload: { error: 'Jogo não encontrado' }
        }));
        return;
    }
    
    const result = game.submitAnswer(ws, answerIndex);
    if (!result.success) {
        ws.send(JSON.stringify({
            type: 'error',
            payload: { error: result.error }
        }));
    }
}

// Atualizar lista de jogadores
function updatePlayerList(game) {
    const playerList = game.getPlayerList();
    
    if (game.host && game.host.readyState === WebSocket.OPEN) {
        game.host.send(JSON.stringify({
            type: 'updatePlayers',
            payload: { players: playerList }
        }));
    }
}

// Manipular desconexão
function handleDisconnection(ws) {
    const clientInfo = clients.get(ws);
    if (!clientInfo) return;
    
    const { gameCode, role, playerName } = clientInfo;
    const game = games.get(gameCode);
    
    if (game) {
        if (role === 'host') {
            // Se o host desconectou, encerrar o jogo
            console.log(`Host do jogo ${gameCode} desconectou. Encerrando jogo.`);
            
            // Notificar todos os jogadores
            game.players.forEach((name, playerWs) => {
                if (playerWs.readyState === WebSocket.OPEN) {
                    playerWs.send(JSON.stringify({
                        type: 'gameEnded',
                        payload: { reason: 'O professor saiu do jogo' }
                    }));
                }
            });
            
            game.cleanup();
            games.delete(gameCode);
        } else if (role === 'player') {
            // Remover jogador
            const removedPlayer = game.removePlayer(ws);
            if (removedPlayer) {
                console.log(`Jogador ${removedPlayer} saiu do jogo ${gameCode}`);
                updatePlayerList(game);
            }
            
            // Se não há mais jogadores, limpar o jogo após um tempo
            if (game.players.size === 0) {
                setTimeout(() => {
                    if (games.has(gameCode) && games.get(gameCode).players.size === 0) {
                        console.log(`Removendo jogo vazio: ${gameCode}`);
                        games.get(gameCode).cleanup();
                        games.delete(gameCode);
                    }
                }, 300000); // 5 minutos
            }
        }
    }
    
    clients.delete(ws);
}

// Limpeza periódica de jogos antigos
setInterval(() => {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2 horas
    
    games.forEach((game, gameCode) => {
        // Verificar se o jogo está inativo há muito tempo
        const isOld = (now - game.questionStartTime) > maxAge;
        const hasNoPlayers = game.players.size === 0 && (!game.host || game.host.readyState !== WebSocket.OPEN);
        
        if (isOld || hasNoPlayers) {
            console.log(`Removendo jogo inativo: ${gameCode}`);
            game.cleanup();
            games.delete(gameCode);
        }
    });
}, 30 * 60 * 1000); // Executar a cada 30 minutos

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Auto-Quiz rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log(`🎮 Jogos ativos: ${games.size}`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promise rejeitada não tratada:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM, encerrando servidor...');
    
    // Notificar todos os clientes
    wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'serverShutdown',
                payload: { message: 'Servidor está sendo reiniciado' }
            }));
            ws.close();
        }
    });
    
    // Limpar todos os jogos
    games.forEach((game) => {
        game.cleanup();
    });
    
    server.close(() => {
        console.log('Servidor encerrado');
        process.exit(0);
    });
});

module.exports = { app, server, wss };

