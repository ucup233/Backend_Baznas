import db from './src/config/database.js';
import fs from 'fs';

async function checkSchema() {
    try {
        const [results] = await db.query("DESCRIBE penerimaan");
        fs.writeFileSync('schema-log.json', JSON.stringify({
            columns: results,
            penerimaan_details: results.map(r => r.Field)
        }, null, 2));

        const [migrations] = await db.query("SELECT name FROM SequelizeMeta");
        fs.appendFileSync('schema-log.json', "\n\nMigrations:\n" + JSON.stringify(migrations.map(m => m.name), null, 2));

        process.exit(0);
    } catch (err) {
        fs.writeFileSync('schema-log.json', "Error: " + err.message);
        process.exit(1);
    }
}

checkSchema();
