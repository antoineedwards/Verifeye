
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually since we aren't using Next.js runtime here
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes
            }
        });
        return envVars;
    } catch (e) {
        console.error("Could not load .env.local", e.message);
        return {};
    }
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

console.log(`Testing connection to ${SUPABASE_URL}...`);

async function testSchema(schema) {
    console.log(`\n--- Testing schema: '${schema}' ---`);
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        db: { schema: schema }
    });

    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            console.log(`Error querying 'users' in '${schema}':`, error.message);
            if (error.code) console.log(`Error code: ${error.code}`);
            return false;
        } else {
            console.log(`Success! Found table 'users' in '${schema}'. Access confirmed.`);
            return true;
        }
    } catch (err) {
        console.log(`Exception testing '${schema}':`, err.message);
        return false;
    }
}

async function inspectSchema(schema) {
    console.log(`\n--- Inspecting contents of schema: '${schema}' ---`);

    // Create client with that schema
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        db: { schema: schema }
    });

    // 1. Try to list all users (just count or 1 row)
    console.log(`Attempting to select from '${schema}.users'...`);
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
        console.error(`❌ Error accessing '${schema}.users':`);
        console.error(`   Message: ${error.message}`);
        console.error(`   Code: ${error.code}`);
        console.error(`   Hint: ${error.hint}`);
        console.error(`   Details: ${error.details}`);
        return;
    }

    console.log(`✅ Successfully verified table '${schema}.users'.`);
    if (data.length > 0) {
        console.log(`   Found ${data.length} row(s).`);
        console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
    } else {
        console.log("   Table is empty.");
    }

    // 2. Try to verify other tables
    const tables = ['accounts', 'sessions', 'verification_tokens'];
    for (const table of tables) {
        const { error: tError } = await supabase.from(table).select('id').limit(1); // Assuming id exists
        if (tError) {
            console.log(`   ⚠️ Could not access '${schema}.${table}': ${tError.message}`);
        } else {
            console.log(`   ✅ Confirmed access to '${schema}.${table}'.`);
        }
    }
}

async function main() {
    console.log("Debugging 'next_auth' schema access...");
    await inspectSchema('next_auth');
}

main();
