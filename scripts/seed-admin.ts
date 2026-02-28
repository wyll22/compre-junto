import bcrypt from "bcryptjs";
import { pool } from "../server/db";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrador";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios para seed:admin");
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD deve ter pelo menos 8 caracteres");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await pool.query<{ id: number }>(
    "SELECT id FROM users WHERE lower(email) = $1 LIMIT 1",
    [email],
  );

  if (existing.rows[0]) {
    await pool.query(
      `UPDATE users
       SET name = $1,
           password = $2,
           role = 'admin'
       WHERE id = $3`,
      [name, hashedPassword, existing.rows[0].id],
    );
    console.log(`Admin atualizado com sucesso: ${email}`);
  } else {
    await pool.query(
      `INSERT INTO users (name, email, password, phone, role)
       VALUES ($1, $2, $3, $4, 'admin')`,
      [name, email, hashedPassword, ""],
    );
    console.log(`Admin criado com sucesso: ${email}`);
  }
}

main()
  .catch((error) => {
    console.error("Falha no seed:admin", {
      message: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
