import pg from 'pg';
import crypto from 'crypto';

const connectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

function hashPasswordNode(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedSuperAdmin() {
  await client.connect();
  console.log('=== SEEDING INITIAL SUPER ADMIN RECORD INTO public.super_admin ===\n');

  try {
    const adminEmail = 'tsriramireddy1999@gmail.com';
    const adminPasswordHash = hashPasswordNode('9440251915');

    // Check if record already exists
    const checkRes = await client.query('SELECT * FROM public.super_admin WHERE email = $1;', [adminEmail]);

    if (checkRes.rows.length > 0) {
      console.log('Super Admin record already exists. Updating password_hash and is_active...');
      await client.query(`
        UPDATE public.super_admin
        SET password_hash = $1, is_active = true, updated_at = NOW()
        WHERE email = $2;
      `, [adminPasswordHash, adminEmail]);
      console.log('Super Admin record updated successfully.');
    } else {
      console.log('Inserting initial Super Admin record...');
      const insertRes = await client.query(`
        INSERT INTO public.super_admin (
          name, email, password_hash, role, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW(), NOW()
        ) RETURNING id, name, email, role, is_active;
      `, ['PharmDVerse Super Admin', adminEmail, adminPasswordHash, 'SUPER_ADMIN', true]);

      console.log('Successfully inserted Super Admin record:', insertRes.rows[0]);
    }

    const countRes = await client.query('SELECT count(*) FROM public.super_admin;');
    console.log(`TOTAL ROWS IN public.super_admin: ${countRes.rows[0].count}`);

  } catch (err) {
    console.error('Error seeding Super Admin:', err);
  } finally {
    await client.end();
  }
}

seedSuperAdmin();
