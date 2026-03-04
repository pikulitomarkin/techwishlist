/**
 * api/tasks/[id].js — Vercel Serverless Function
 *
 * PUT    /api/tasks/:id  → atualiza uma tarefa
 * DELETE /api/tasks/:id  → remove uma tarefa
 */
import { Pool } from 'pg';

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
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const db = getPool();

  try {
    // ── PUT: atualiza campos enviados ──
    if (req.method === 'PUT') {
      const body = req.body ?? {};
      const ALLOWED = ['name', 'priority', 'status', 'responsavel'];

      const fields = [];
      const values = [];
      let i = 1;

      for (const key of ALLOWED) {
        if (key in body) {
          fields.push(`${key} = $${i++}`);
          values.push(body[key]);
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido para atualizar.' });
      }

      values.push(id);

      const { rows } = await db.query(
        `UPDATE tech_wishlist
            SET ${fields.join(', ')}
          WHERE id = $${i}
          RETURNING *`,
        values
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Tarefa não encontrada.' });
      }

      return res.status(200).json(rows[0]);
    }

    // ── DELETE: remove tarefa ──
    if (req.method === 'DELETE') {
      await db.query('DELETE FROM tech_wishlist WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (err) {
    console.error(`[api/tasks/${id}] erro:`, err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}
