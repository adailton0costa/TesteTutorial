const express = require('express');
const router = express.Router();
const db = require('../db');

// Criação de sala
router.post('/', (req, res) => {
  const { nome, userId } = req.body;

  if (!nome || !userId) {
    return res.status(400).json({ message: 'Nome da sala e userId são obrigatórios.' });
  }

  const query = `INSERT INTO salas (nome, creator_id) VALUES (?, ?)`;
  db.run(query, [nome, userId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro ao criar sala.' });
    }

    res.status(201).json({ message: 'Sala criada com sucesso!', sala_id: this.lastID });
  });
});

// Buscar salas criadas por um usuário específico
router.get('/', (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: 'Parâmetro userId é obrigatório.' });
  }

  const query = `SELECT * FROM salas WHERE creator_id = ?`;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erro ao buscar salas.' });
    }

    res.json(rows);
  });
});

module.exports = router;
