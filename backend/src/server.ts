import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // carregando variáveis de ambiente
const app = express();
const port = 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const [rows]: any = await db.query(
      'SELECT * FROM usuario WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = rows[0];
    
    const match = argon2.verify(user.password, password);

    if (!match) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    res.json({ name: user.name, email: user.email });
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
