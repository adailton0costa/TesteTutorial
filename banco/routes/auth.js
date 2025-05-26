const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

// Armazenar tokens na memória (para produção, use cache ou banco)
const resetTokens = {};

// Cadastro
router.post('/registro', (req, res) => {
  const { name, email, password, apelido, pais, foto } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ erro: 'Todos os campos obrigatórios (name, email, password).' });
  }

  // Se pais for objeto ou string JSON, converta para string antes de salvar
  let paisString = null;
  if (pais) {
    if (typeof pais === 'object') {
      paisString = JSON.stringify(pais);
    } else {
      // tenta garantir que é string JSON válida
      paisString = pais;
    }
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = `
    INSERT INTO users (name, email, password, apelido, pais, foto) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [name, email, hashedPassword, apelido || null, paisString, foto || null], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ erro: 'E-mail já cadastrado.' });
      }
      return res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
    }

    return res.status(200).json({ sucesso: true, id: this.lastID });
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Erro no servidor' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const senhaValida = bcrypt.compareSync(password, user.password);

    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Remover senha antes de enviar dados do usuário
    delete user.password;

    res.json({ message: 'Login bem-sucedido', user });
  });
});

// Esqueci a senha
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'E-mail é obrigatório.' });

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ message: 'Erro no servidor.' });
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    const token = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 3600000; // 1 hora

    resetTokens[token] = { email, expires };

    const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'contatopreparaenade@gmail.com',
        pass: 'Yitp meyo sbuq tnqg' // cuidado com dados sensíveis no código!
      }
    });

    const mailOptions = {
      from: 'contatopreparaenade@gmail.com',
      to: email,
      subject: 'Link para redefinição de senha',
      text: `Clique no link para redefinir sua senha: ${resetLink}`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        return res.status(500).json({ message: 'Erro ao enviar o e-mail.' });
      }
      res.json({ message: 'Link de redefinição enviado para seu e-mail.' });
    });
  });
});

// Resetar senha
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) return res.status(400).json({ message: 'Dados inválidos.' });

  const tokenData = resetTokens[token];

  if (!tokenData) return res.status(400).json({ message: 'Token inválido.' });

  if (Date.now() > tokenData.expires) {
    delete resetTokens[token];
    return res.status(400).json({ message: 'Token expirado.' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, tokenData.email], (err) => {
    if (err) return res.status(500).json({ message: 'Erro ao atualizar senha.' });

    delete resetTokens[token];
    res.json({ message: 'Senha atualizada com sucesso.' });
  });
});

// Ranking de usuários por pontuação
router.get('/ranking', (req, res) => {
  const query = `
    SELECT u.name, 
           COALESCE(SUM(s.pontuacao), 0) AS total_pontos
    FROM users u
    LEFT JOIN simulados s ON s.user_id = u.id
    GROUP BY u.id
    ORDER BY total_pontos DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ erro: 'Erro ao buscar ranking' });
    res.json(rows);
  });
});

// Atualizar perfil do usuário
router.put('/update-profile', (req, res) => {
  const { id, name, nickname, password, pais, foto } = req.body;

  if (!id) {
    return res.status(400).json({ erro: 'ID do usuário é obrigatório.' });
  }

  const fields = [];
  const values = [];

  if (name) {
    fields.push('name = ?');
    values.push(name);
  }

  if (nickname) {
    fields.push('nickname = ?');
    values.push(nickname);
  }

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    fields.push('password = ?');
    values.push(hashedPassword);
  }
    if (pais) {
    fields.push('pais = ?');
    values.push(pais);
  }

  if (foto) {
    fields.push('foto = ?');
    values.push(foto);
  }

  if (fields.length === 0) {
    return res.status(400).json({ erro: 'Nenhum dado para atualizar.' });
  }

  values.push(id);

  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

  db.run(query, values, function(err) {
    if (err) {
      console.error('Erro ao atualizar perfil:', err); // <<< Veja o erro no console!
      return res.status(500).json({ erro: 'Erro ao atualizar perfil.', detalhes: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.json({ sucesso: true, message: 'Perfil atualizado com sucesso.' });
  });
});

// Simulação de banco de dados em memória
let usuario = {
  nome: "Usuário Exemplo",
  email: "exemplo@teste.com"
};

// Rota para atualizar perfil
router.put('/atualizar-perfil', (req, res) => {
  const dadosAtualizados = req.body;

  // Aqui você deve validar os dados recebidos

  // Atualiza o usuário (no seu banco seria uma query de update)
  usuario = { ...usuario, ...dadosAtualizados };

  // Retorna sucesso
  res.json({ success: true, usuario });
});

// Rota para obter dados do usuário (opcional)
router.get('/perfil', (req, res) => {
  res.json(usuario);
});

module.exports = router;
