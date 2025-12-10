const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Supabase connection pooling sometimes
    }
});

async function runMigrations() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected.');

        // Get all SQL files in scripts dir
        const scriptsDir = __dirname;
        const files = fs.readdirSync(scriptsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            console.log(`Running ${file}...`);
            const sql = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
            try {
                await client.query(sql);
                console.log(`✅ ${file} completed`);
            } catch (err) {
                // Log error but continue if it's just "already exists" (though pg doesn't distinguish easily)
                // For policies, "already exists" is a common error if re-running.
                console.log(`⚠️ Error in ${file}: ${err.message}`);
            }
        }

        console.log('All migrations finished.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigrations();
