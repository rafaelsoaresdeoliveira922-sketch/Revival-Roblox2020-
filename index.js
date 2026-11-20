const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const usuarios = [];

app.post(['/v2/signup', '/signup/v1'], (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ errors: [{ code: 1, message: "Preencha usuário e senha" }] });
  }

  const existe = usuarios.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existe) {
    return res.status(400).json({ errors: [{ code: 6, message: "Esse nome já existe" }] });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const novoUsuario = { id: usuarios.length + 1, username, password, token };
  usuarios.push(novoUsuario);

  res.cookie('.ROBLOSECURITY', token, { httpOnly: true, path: '/' });
  return res.status(200).json({ userId: novoUsuario.id });
});

app.post(['/v2/login', '/login/v1'], (req, res) => {
  const { username, cvalue, password } = req.body;
  const nomeBusca = username || cvalue;

  const user = usuarios.find(
    u => u.username.toLowerCase() === String(nomeBusca).toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(403).json({ errors: [{ code: 1, message: "Usuário ou senha incorretos" }] });
  }

  res.cookie('.ROBLOSECURITY', user.token, { httpOnly: true, path: '/' });
  return res.status(200).json({
    user: { id: user.id, name: user.username, displayName: user.username }
  });
});

app.get('/v1/users/authenticated', (req, res) => {
  const token = req.cookies['.ROBLOSECURITY'];
  const user = usuarios.find(u => u.token === token);

  if (!user) return res.status(401).json({ errors: [{ code: 0, message: "Não autenticado" }] });

  return res.json({
    id: user.id,
    name: user.username,
    displayName: user.username
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
      
