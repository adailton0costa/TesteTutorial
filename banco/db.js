const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./banco.db');

// Criar tabelas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enunciado TEXT NOT NULL,
    categoria TEXT,
    banca TEXT,
    ano INTEGER,
    comentario TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS alternativas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER,
    texto TEXT,
    correta BOOLEAN,
    FOREIGN KEY (question_id) REFERENCES questions(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS salas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    creator_id INTEGER,
    FOREIGN KEY(creator_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sala_usuarios (
    sala_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY(sala_id) REFERENCES salas(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS simulados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sala_id INTEGER,
    user_id INTEGER,
    pontuacao INTEGER,
    data DATE
  )`);
});

// Adicionar colunas se não existirem
db.serialize(() => {
  db.run("ALTER TABLE users ADD COLUMN apelido TEXT", (err) => {
    if (err && !err.message.includes("duplicate column")) console.error("Erro ao adicionar 'apelido':", err.message);
  });
  db.run("ALTER TABLE users ADD COLUMN pais TEXT", (err) => {
    if (err && !err.message.includes("duplicate column")) console.error("Erro ao adicionar 'pais':", err.message);
  });
  db.run("ALTER TABLE users ADD COLUMN foto TEXT", (err) => {
    if (err && !err.message.includes("duplicate column")) console.error("Erro ao adicionar 'foto':", err.message);
  });
});

module.exports = db;
