import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import argon2 from 'argon2';
import { db } from './db.ts';

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

app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    // TODO PROX SEMESTRE: PEGAR O ID DO USUARIO LOGADO E ADICIONAR NA QUERY
    const [ativosRows]: any = await db.query('SELECT COUNT(*) AS ativos FROM paciente WHERE ativo = 1');
    const [inativosRows]: any = await db.query('SELECT COUNT(*) AS inativos FROM paciente WHERE ativo = 0');
    const [agendadasRows]: any = await db.query('SELECT COUNT(*) AS agendadas FROM agenda WHERE horario_inicio >= CURDATE()');

    const [graficoRows]: any = await db.query(`
      SELECT 
        MONTH(criado_em) AS mes,
        SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) AS ativos,
        SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) AS inativos
      FROM paciente
      WHERE YEAR(criado_em) = YEAR(CURDATE())
      GROUP BY MONTH(criado_em)
      ORDER BY mes
    `);

    const cards = {
      ativos: ativosRows[0]?.ativos || 0,
      inativos: inativosRows[0]?.inativos || 0,
      agendadas: agendadasRows[0]?.agendadas || 0,
    };

    res.json({ cards, grafico: graficoRows });
  } catch (err) {
    console.error('Erro no dashboard:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard'});
}
});

app.get('/api/patients', async (req: Request, res: Response) => {
  try {
    // TODO PROX SEMESTRE: PEGAR O ID DO USUARIO LOGADO E ADICIONAR NA QUERY
    const [rows]: any = await db.query(`
      SELECT 
        id,
        nome AS name,
        telefone AS phone,
        email,
        ativo,
        criado_em
      FROM paciente
      ORDER BY criado_em DESC
    `);

    const formatted = rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      email: p.email,
      status: p.ativo ? 'active' : 'inactive',
      createdAt: new Date(p.criado_em).toLocaleDateString('pt-BR'),
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Erro ao buscar pacientes:', err);
    res.status(500).json({ error: 'Erro ao buscar pacientes' });
  }
});

app.get('/api/patients/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // TODO PROX SEMESTRE: PEGAR O ID DO USUARIO LOGADO E ADICIONAR NA QUERY
    const [rows]: any = await db.query(
      `SELECT 
        id,
        nome AS name,
        cpf,
        rg,
        DATE_FORMAT(data_nascimento, '%d/%m/%Y') AS birthDate,
        email,
        telefone AS phone,
        notas AS notes
      FROM paciente
      WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar paciente:', err);
    res.status(500).json({ error: 'Erro ao buscar paciente' });
  }
});

app.post('/api/patients', async (req: Request, res: Response) => {
  try {
    const {
      name,
      cpf,
      rg,
      birthDate,
      email,
      phone,
      notes,
    } = req.body;

    // TODO: usar ID do usuário autenticado
    const usuarioId = 1;

    // Normalização dos campos opcionais
    const rgClean = rg?.trim() || null;
    const emailClean = email?.trim() || null;
    const notesClean = notes?.trim() || null;
    const birthDateClean = birthDate?.trim() || null;
    const cpfClean = cpf?.trim() || null;

    const [result]: any = await db.query(
      `INSERT INTO paciente (
        usuario_id, nome, cpf, rg, data_nascimento, email, telefone, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuarioId, name, cpfClean, rgClean, birthDateClean, emailClean, phone, notesClean]
    );

    const newId = result.insertId;

    const [rows]: any = await db.query(
      `SELECT id, nome AS name, telefone AS phone, email, ativo, criado_em 
       FROM paciente WHERE id = ?`,
      [newId]
    );

    const p = rows[0];

    res.status(201).json({
      id: p.id,
      name: p.name,
      phone: p.phone,
      email: p.email,
      status: p.ativo ? "active" : "inactive",
      createdAt: new Date(p.criado_em).toLocaleDateString("pt-BR"),
    });
  } catch (err) {
    console.error("Erro ao criar paciente:", err);
    res.status(500).json({ error: "Erro ao criar paciente" });
  }
});

app.put('/api/patient/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    cpf,
    rg,
    birthDate,
    email,
    phone,
    notes,
    status,
  } = req.body;

  try {
    const ativo = status === 'active';

    const [result]: any = await db.query(
      `UPDATE paciente SET 
        nome = ?, 
        cpf = ?, 
        rg = ?, 
        data_nascimento = ?, 
        email = ?, 
        telefone = ?, 
        notas = ?, 
        ativo = ?
      WHERE id = ?`,
      [
        name?.trim(),
        cpf?.trim(),
        rg?.trim(),
        birthDate?.trim(),
        email?.trim() || null,
        phone?.trim(),
        notes?.trim() || null,
        ativo,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.status(200).json({ message: 'Paciente atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar paciente:', err);
    res.status(500).json({ error: 'Erro ao atualizar paciente' });
  }
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
