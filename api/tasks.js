/**
 * api/tasks.js — Vercel Serverless Function
 *
 * GET  /api/tasks  → lista todas as tarefas
 * POST /api/tasks  → cria uma nova tarefa
 */
import { Pool } from 'pg';

// Pool reutilizado entre invocações na mesma instância
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const db = getPool();

  try {
    // ── GET: lista tarefas ordenadas por prioridade ──
    if (req.method === 'GET') {
      const { rows } = await db.query(
        'SELECT * FROM tech_wishlist ORDER BY priority DESC, created_at DESC'
      );
      return res.status(200).json(rows);
    }

    // ── POST: cria nova tarefa ──
    if (req.method === 'POST') {
      const {
        name,
        priority = 3,
        status = 'Pendente',
        responsavel = '',
      } = req.body ?? {};

      if (!name?.trim()) {
        return res.status(400).json({ error: 'O campo "name" é obrigatório.' });
      }

      const { rows } = await db.query(
        `INSERT INTO tech_wishlist (name, priority, status, responsavel)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name.trim(), Number(priority), status, responsavel ?? '']
      );

      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (err) {
    console.error('[api/tasks] erro:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}
