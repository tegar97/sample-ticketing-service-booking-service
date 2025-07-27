const fs = require('fs');
const path = require('path');
const pool = require('./database');

// Function to run migrations
async function runMigrations() {
    console.log('Running database migrations...');
    
    try {
        // Create migrations table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Get list of executed migrations
        const { rows } = await pool.query('SELECT name FROM migrations');
        const executedMigrations = rows.map(row => row.name);
        
        // Get all migration files
        const migrationsDir = path.join(__dirname, '../migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Sort to ensure migrations run in order
        
        // Execute migrations that haven't been run yet
        for (const file of migrationFiles) {
            if (!executedMigrations.includes(file)) {
                console.log(`Executing migration: ${file}`);
                
                // Read and execute the migration file
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf8');
                
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    await client.query(sql);
                    await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                    await client.query('COMMIT');
                    console.log(`Migration ${file} executed successfully`);
                } catch (error) {
                    await client.query('ROLLBACK');
                    console.error(`Error executing migration ${file}:`, error);
                    throw error;
                } finally {
                    client.release();
                }
            }
        }
        
        console.log('All migrations completed successfully');
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    }
}

module.exports = { runMigrations };