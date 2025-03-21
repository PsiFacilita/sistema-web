import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // carregando variáveis de ambiente
const app = express();
const port = 5000;

app.use(cors());

app.get('/api/data', (req, res) => {
  res.json({ message: "Hello from backend" });
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
