const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const questaoRoutes = require('./routes/questoes');
const salaRoutes = require('./routes/salas');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Servir arquivos estáticos (HTML, CSS, JS, etc.) da raiz do projeto (ajuste o caminho conforme a estrutura)
app.use(express.static(path.join(__dirname, '..')));

// Rotas para as páginas específicas, caso precise servir direto por rota
app.get('/reset-password.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'reset-password.html'));
});

app.get('/forgot-password.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'forgot-password.html'));
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/questoes', questaoRoutes);
app.use('/api/salas', salaRoutes);


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
