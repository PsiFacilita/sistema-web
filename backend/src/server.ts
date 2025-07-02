import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import argon2 from 'argon2';
import { db } from './db.ts';

dotenv.config();
const app = express();
const port = 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// LOGIN
app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const [rows]: any = await db.query('SELECT * FROM usuario WHERE email = ? LIMIT 1', [email]);

    if (rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });

    const user = rows[0];
    const match = argon2.verify(user.password, password);

    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

    res.json({ name: user.name, email: user.email });
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DASHBOARD
app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
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
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

// LISTAGEM DE PACIENTES
app.get('/api/patients', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await db.query(`
      SELECT id, nome AS name, telefone AS phone, email, ativo, criado_em
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

// DETALHES DE UM PACIENTE
app.get('/api/patients/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const usuarioId = 1;

    const [pacienteRows]: any = await db.query(`
      SELECT 
        id, nome AS name, cpf, rg,
        DATE_FORMAT(data_nascimento, '%d/%m/%Y') AS birthDate,
        email, telefone AS phone, notas AS notes, ativo
      FROM paciente
      WHERE id = ? AND usuario_id = ?`,
      [id, usuarioId]
    );

    if (pacienteRows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    const paciente = pacienteRows[0];

    const [campos]: any = await db.query(`
      SELECT 
        cp.id, cp.nome_campo AS name, cp.tipo_campo AS type, 
        cp.obrigatorio AS required, cpp.value
      FROM campos_personalizados cp
      LEFT JOIN campo_personalizado_pacientes cpp 
        ON cpp.campo_personalizado_id = cp.id AND cpp.paciente_id = ?
      WHERE cp.usuario_id = ?
      ORDER BY cp.id`,
      [id, usuarioId]
    );

    const result = {
      ...paciente,
      status: paciente.ativo ? 'active' : 'inactive',
      customFields: campos.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        required: !!c.required,
        value: c.value || ''
      }))
    };

    res.json(result);
  } catch (err) {
    console.error('Erro ao buscar paciente e campos personalizados:', err);
    res.status(500).json({ error: 'Erro ao buscar paciente e campos personalizados' });
  }
});

// CAMPOS PERSONALIZADOS DISPONÍVEIS
app.get('/api/fields', async (req: Request, res: Response) => {
  try {
    const usuarioId = 1;

    const [rows]: any = await db.query(`
      SELECT id, nome_campo AS name, tipo_campo AS type, obrigatorio AS required
      FROM campos_personalizados
      WHERE usuario_id = ?
      ORDER BY id`,
      [usuarioId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar campos personalizados:', err);
    res.status(500).json({ error: 'Erro ao buscar campos personalizados' });
  }
});

// CRIAÇÃO DE CAMPO PERSONALIZADO
app.post('/api/fields', async (req: Request, res: Response) => {
  try {
    const { name, type, required } = req.body;
    const usuarioId = 1;

    if (!name?.trim() || !type) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
    }

    await db.query(
      `INSERT INTO campos_personalizados (usuario_id, nome_campo, tipo_campo, obrigatorio)
       VALUES (?, ?, ?, ?)`,
      [usuarioId, name.trim(), type.trim(), required ? 1 : 0]
    );

    res.status(201).json({ message: 'Campo criado com sucesso' });
  } catch (err) {
    console.error('Erro ao criar campo personalizado:', err);
    res.status(500).json({ error: 'Erro ao criar campo personalizado' });
  }
});

// ATUALIZAÇÃO DE CAMPO PERSONALIZADO
app.put('/api/fields/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, required } = req.body;
    const usuarioId = 1;

    if (!name?.trim() || !type) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
    }

    const [result]: any = await db.query(
      `UPDATE campos_personalizados
       SET nome_campo = ?, tipo_campo = ?, obrigatorio = ?
       WHERE id = ? AND usuario_id = ?`,
      [name.trim(), type.trim(), required ? 1 : 0, id, usuarioId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Campo não encontrado' });
    }

    res.status(200).json({ message: 'Campo atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao editar campo personalizado:', err);
    res.status(500).json({ error: 'Erro ao editar campo personalizado' });
  }
});

// REMOÇÃO DE CAMPO PERSONALIZADO
app.delete('/api/fields/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = 1;

    const [result]: any = await db.query(
      `DELETE FROM campos_personalizados WHERE id = ? AND usuario_id = ?`,
      [id, usuarioId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Campo não encontrado' });
    }

    res.status(200).json({ message: 'Campo removido com sucesso' });
  } catch (err) {
    console.error('Erro ao remover campo personalizado:', err);
    res.status(500).json({ error: 'Erro ao remover campo personalizado' });
  }
});

// CRIAÇÃO DE PACIENTE
app.post('/api/patients', async (req: Request, res: Response) => {
  try {
    const {
      name, cpf, rg, birthDate, email, phone, notes, customFields = []
    } = req.body;

    const usuarioId = 1;

    const [result]: any = await db.query(`
      INSERT INTO paciente (usuario_id, nome, cpf, rg, data_nascimento, email, telefone, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuarioId, name, cpf?.trim(), rg?.trim() || null, birthDate?.trim(), email?.trim(), phone, notes?.trim()]
    );

    const newId = result.insertId;

    for (const field of customFields) {
      if (!field.value?.trim()) continue;
      await db.query(
        `INSERT INTO campo_personalizado_pacientes (paciente_id, campo_personalizado_id, value)
         VALUES (?, ?, ?)`,
        [newId, field.id, field.value]
      );
    }

    const [rows]: any = await db.query(`
      SELECT id, nome AS name, telefone AS phone, email, ativo, criado_em
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

// EDIÇÃO DE PACIENTE
app.put('/api/patient/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name, cpf, rg, birthDate, email, phone, notes, status, customFields = []
  } = req.body;

  try {
    const ativo = status === 'active';

    const [result]: any = await db.query(`
      UPDATE paciente SET 
        nome = ?, cpf = ?, rg = ?, data_nascimento = ?, email = ?, 
        telefone = ?, notas = ?, ativo = ?
      WHERE id = ?`,
      [
        name?.trim(), cpf?.trim(), rg?.trim(), birthDate?.trim(),
        email?.trim() || null, phone?.trim(), notes?.trim() || null, ativo, id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    await db.query(`DELETE FROM campo_personalizado_pacientes WHERE paciente_id = ?`, [id]);

    for (const field of customFields) {
      if (!field.value?.trim()) continue;
      await db.query(
        `INSERT INTO campo_personalizado_pacientes (paciente_id, campo_personalizado_id, value)
         VALUES (?, ?, ?)`,
        [id, field.id, field.value]
      );
    }

    res.status(200).json({ message: 'Paciente atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar paciente:', err);
    res.status(500).json({ error: 'Erro ao atualizar paciente' });
  }
});

// START SERVER
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
