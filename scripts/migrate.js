/**
 * scripts/migrate.js
 * Cria (ou atualiza) a tabela tech_wishlist no banco Neon.
 * 
 * Uso:
 *   DATABASE_URL="postgresql://..." node scripts/migrate.js
 */
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('✅ Conectado ao banco Neon!');

  // Cria a tabela principal
  await client.query(`
    CREATE TABLE IF NOT EXISTS tech_wishlist (
      id          BIGSERIAL PRIMARY KEY,
      name        TEXT    NOT NULL,
      priority    INTEGER NOT NULL DEFAULT 3,
      status      TEXT    NOT NULL DEFAULT 'Pendente',
      responsavel TEXT             DEFAULT '',
      created_at  TIMESTAMPTZ      DEFAULT NOW()
    )
  `);
  console.log('✅ Tabela tech_wishlist criada/verificada!');

  // Garante colunas novas para instâncias antigas
  await client.query(`
    ALTER TABLE tech_wishlist
      ADD COLUMN IF NOT EXISTS status      TEXT DEFAULT 'Pendente',
      ADD COLUMN IF NOT EXISTS responsavel TEXT DEFAULT ''
  `);
  console.log('✅ Colunas status e responsavel garantidas!');

  console.log('\n🎉 Migração concluída com sucesso!');
} catch (err) {
  console.error('❌ Erro na migração:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
