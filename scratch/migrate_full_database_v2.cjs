const { Client } = require('pg');

const oldConnectionString = 'postgresql://postgres.uvvzhrvrqtqwyhlptvnx:kNJuN5IIKtogQWKT@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
const newConnectionString = 'postgresql://postgres.ngfgwgwofnuwqrbmvtuo:xaSPYQPLysXv2rbo@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

function parsePgArray(arrVal) {
  if (Array.isArray(arrVal)) return arrVal;
  if (typeof arrVal === 'string') {
    return arrVal.replace(/^\{|\}$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  }
  return [];
}

async function cloneDatabase() {
  const oldClient = new Client({ connectionString: oldConnectionString, ssl: { rejectUnauthorized: false } });
  const newClient = new Client({ connectionString: newConnectionString, ssl: { rejectUnauthorized: false } });

  await oldClient.connect();
  await newClient.connect();

  console.log('Connected to both Old and New PostgreSQL databases.\n');

  try {
    // 1. Get all table names in public schema
    const tablesRes = await oldClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables in old database public schema:`);
    console.log(tables.join(', '), '\n');

    // 2. Fetch custom functions/RPCs from old DB
    const funcsRes = await oldClient.query(`
      SELECT pg_get_functiondef(p.oid) as func_def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        AND p.proname NOT LIKE 'pg_%';
    `);
    console.log(`Found ${funcsRes.rows.length} custom functions in old database.`);

    // 3. Create Tables
    for (const table of tables) {
      console.log(`Processing schema for table: public."${table}"...`);
      
      const colsRes = await oldClient.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      const colDefs = colsRes.rows.map(col => {
        let typeStr = col.udt_name;
        if (col.data_type === 'ARRAY') {
          typeStr = col.udt_name.replace('_', '') + '[]';
        } else if (col.udt_name === 'varchar' && col.character_maximum_length) {
          typeStr = `VARCHAR(${col.character_maximum_length})`;
        } else if (col.udt_name === 'numeric') {
          typeStr = 'NUMERIC';
        }
        
        let def = `"${col.column_name}" ${typeStr}`;
        if (col.is_nullable === 'NO') def += ' NOT NULL';
        if (col.column_default !== null) def += ` DEFAULT ${col.column_default}`;
        return def;
      });

      const pkRes = await oldClient.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1;
      `, [table]);

      if (pkRes.rows.length > 0) {
        const pkCols = pkRes.rows.map(r => `"${r.column_name}"`).join(', ');
        colDefs.push(`PRIMARY KEY (${pkCols})`);
      }

      const createTableSql = `CREATE TABLE IF NOT EXISTS public."${table}" (\n  ${colDefs.join(',\n  ')}\n);`;
      await newClient.query(createTableSql);

      const uniqueRes = await oldClient.query(`
        SELECT tc.constraint_name, array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as cols
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'UNIQUE'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1
        GROUP BY tc.constraint_name;
      `, [table]);

      for (const u of uniqueRes.rows) {
        const colList = parsePgArray(u.cols);
        if (colList.length === 0) continue;
        const uCols = colList.map(c => `"${c}"`).join(', ');
        const addUniqueSql = `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = '${u.constraint_name}'
            ) THEN
              ALTER TABLE public."${table}" ADD CONSTRAINT "${u.constraint_name}" UNIQUE (${uCols});
            END IF;
          END $$;
        `;
        try {
          await newClient.query(addUniqueSql);
        } catch (e) {
          // ignore
        }
      }
    }

    // 4. Add Foreign Keys
    console.log('\n--- CREATING FOREIGN KEYS ---');
    for (const table of tables) {
      const fkRes = await oldClient.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.update_rule,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = $1;
      `, [table]);

      for (const fk of fkRes.rows) {
        const addFkSql = `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = '${fk.constraint_name}'
            ) THEN
              ALTER TABLE public."${table}" 
              ADD CONSTRAINT "${fk.constraint_name}" 
              FOREIGN KEY ("${fk.column_name}") 
              REFERENCES public."${fk.foreign_table_name}" ("${fk.foreign_column_name}")
              ON UPDATE ${fk.update_rule} ON DELETE ${fk.delete_rule};
            END IF;
          END $$;
        `;
        try {
          await newClient.query(addFkSql);
        } catch (e) {
          // ignore
        }
      }
    }

    // 5. Create Custom Functions in New DB
    console.log('\n--- CREATING CUSTOM FUNCTIONS ---');
    for (const funcRow of funcsRes.rows) {
      try {
        await newClient.query(funcRow.func_def);
        console.log(`Applied custom function.`);
      } catch (e) {
        console.error(`Error creating function:`, e.message);
      }
    }

    // 6. Enable RLS and sync RLS Policies
    console.log('\n--- SYNCING RLS POLICIES & SECURITY ---');
    for (const table of tables) {
      await newClient.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);

      const polRes = await oldClient.query(`
        SELECT policyname, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = $1;
      `, [table]);

      for (const pol of polRes.rows) {
        const roles = parsePgArray(pol.roles).join(', ') || 'public';
        let createPolSql = `CREATE POLICY "${pol.policyname}" ON public."${table}" FOR ${pol.cmd} TO ${roles}`;
        if (pol.qual) createPolSql += ` USING (${pol.qual})`;
        if (pol.with_check) createPolSql += ` WITH CHECK (${pol.with_check})`;
        
        try {
          await newClient.query(`DROP POLICY IF EXISTS "${pol.policyname}" ON public."${table}";`);
          await newClient.query(createPolSql);
        } catch (e) {
          console.log(`Notice (Policy ${pol.policyname} on ${table}):`, e.message);
        }
      }
    }

    // 7. PRE-TRUNCATE ALL TABLES FIRST (BEFORE INSERTING ANY DATA)
    console.log('\n--- PRE-TRUNCATING ALL TABLES IN NEW DB ---');
    await newClient.query("SET session_replication_role = 'replica';");
    const tableListQuoted = tables.map(t => `public."${t}"`).join(', ');
    await newClient.query(`TRUNCATE TABLE ${tableListQuoted} CASCADE;`);
    console.log('All tables truncated.');

    // 8. INSERT ALL DATA
    console.log('\n--- INSERTING TABLE DATA ---');
    for (const table of tables) {
      process.stdout.write(`Migrating data for public."${table}"... `);

      const dataRes = await oldClient.query(`SELECT * FROM public."${table}"`);
      const rows = dataRes.rows;

      if (rows.length === 0) {
        console.log(`0 rows.`);
        continue;
      }

      const colsRes = await oldClient.query(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1;
      `, [table]);
      
      const colTypes = {};
      for (const c of colsRes.rows) colTypes[c.column_name] = c.udt_name;

      const cols = Object.keys(rows[0]);
      const colList = cols.map(c => `"${c}"`).join(', ');

      let insertedCount = 0;
      for (const row of rows) {
        const paramPlaceholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        const values = cols.map(c => {
          let val = row[c];
          if (val === null || val === undefined) return null;
          
          const udt = colTypes[c];
          if ((udt === 'json' || udt === 'jsonb') && typeof val === 'object') {
            return JSON.stringify(val);
          }
          if (typeof val === 'object' && !(val instanceof Date) && !Buffer.isBuffer(val) && !Array.isArray(val)) {
            return JSON.stringify(val);
          }
          return val;
        });

        const insertSql = `INSERT INTO public."${table}" (${colList}) VALUES (${paramPlaceholders});`;
        await newClient.query(insertSql, values);
        insertedCount++;
      }

      console.log(`DONE (${insertedCount} rows inserted).`);
    }

    await newClient.query("SET session_replication_role = 'origin';");
    console.log('\n==================================================');
    console.log('  Database Migration & Copy Completed Successfully!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('\n[FATAL MIGRATION ERROR]:', err);
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

cloneDatabase();
