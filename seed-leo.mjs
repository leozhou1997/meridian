import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // Leo's credentials
    const email = "leo@meridianos.ai";
    const password = "demo123";
    const name = "Leo Zhou";
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if Leo already has this email
    const [existingByEmail] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingByEmail.length > 0) {
      console.log(`User with email ${email} already exists (id: ${existingByEmail[0].id}). Updating password...`);
      await connection.execute(
        "UPDATE users SET passwordHash = ?, loginMethod = 'email' WHERE email = ?",
        [passwordHash, email]
      );
      console.log("Password updated successfully.");
    } else {
      // Update existing Leo user (id=1) with the new email and password
      const [existingLeo] = await connection.execute(
        "SELECT id, openId, name FROM users WHERE id = 1"
      );

      if (existingLeo.length > 0) {
        console.log(`Found existing Leo user (id: 1, openId: ${existingLeo[0].openId}). Updating with new email and password...`);
        await connection.execute(
          "UPDATE users SET email = ?, passwordHash = ?, name = ? WHERE id = 1",
          [email, passwordHash, name]
        );
        console.log(`Updated Leo's account: email=${email}, password=${password}`);
      } else {
        // Create new user
        const openId = `local_leo_${Date.now()}`;
        await connection.execute(
          "INSERT INTO users (openId, email, name, passwordHash, loginMethod, role) VALUES (?, ?, ?, ?, 'email', 'admin')",
          [openId, email, name, passwordHash]
        );
        const [newUser] = await connection.execute("SELECT LAST_INSERT_ID() as id");
        const userId = newUser[0].id;
        console.log(`Created new Leo user (id: ${userId})`);

        // Create tenant
        const slug = `workspace-${userId}-${Date.now()}`;
        await connection.execute(
          "INSERT INTO tenants (name, slug, plan) VALUES (?, ?, 'trial')",
          [`${name}'s Workspace`, slug]
        );
        const [newTenant] = await connection.execute("SELECT LAST_INSERT_ID() as id");
        const tenantId = newTenant[0].id;

        // Create tenant membership
        await connection.execute(
          "INSERT INTO tenantMembers (tenantId, userId, role) VALUES (?, ?, 'owner')",
          [tenantId, userId]
        );
        console.log(`Created tenant (id: ${tenantId}) and membership for Leo`);
      }
    }

    // Verify
    const [verify] = await connection.execute(
      "SELECT u.id, u.email, u.name, u.passwordHash IS NOT NULL as hasPassword, tm.tenantId FROM users u LEFT JOIN tenantMembers tm ON u.id = tm.userId WHERE u.email = ?",
      [email]
    );
    console.log("\nVerification:", verify[0]);
    console.log("\n✅ Leo's demo account is ready!");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
