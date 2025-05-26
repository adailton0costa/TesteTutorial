const express = require('express');
const db = require('../db');
const router = express.Router();

// Listar todas as questões com alternativas
router.get('/', (req, res) => {
  db.all(`SELECT * FROM questions`, [], (err, questions) => {
    if (err) return res.status(500).json({ error: err.message });

    const results = [];

    let pending = questions.length;

    if (pending === 0) return res.json([]);

    questions.forEach(question => {
      db.all(`SELECT * FROM alternativas WHERE question_id = ?`, [question.id], (err, alternativas) => {
        if (err) return res.status(500).json({ error: err.message });

        results.push({ ...question, alternativas });

        if (--pending === 0) res.json(results);
      });
    });
  });
});

// Inserir questão + alternativas
router.post('/', (req, res) => {
  const { enunciado, categoria, banca, ano, alternativas, comentario } = req.body;  // inclua comentario

  console.log('Recebido no backend:', req.body);

  db.run(
    `INSERT INTO questions (enunciado, categoria, banca, ano, comentario) VALUES (?, ?, ?, ?, ?)`,
    [enunciado, categoria, banca, ano, comentario],  // passe comentario aqui
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const questionId = this.lastID;

      alternativas.forEach(alt => {
        db.run(
          `INSERT INTO alternativas (question_id, texto, correta) VALUES (?, ?, ?)`,
          [questionId, alt.texto, alt.correta ? 1 : 0]
        );
      });

      res.json({ message: 'Questão cadastrada com sucesso' });
    }
  );
});

module.exports = router;
