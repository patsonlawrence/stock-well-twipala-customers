const sql = require('mssql');

// SQL Server config
const config = {
    user: 'sa',
    password: 'admin@stockwell',
    server: 'localhost', // use 'localhost' if it's local
    database: 'stockwell',
    options: {
        encrypt: true, // true for Azure, false for local
        trustServerCertificate: true // change to false if using a CA-signed cert
    }
};
async function connectToDatabase() {
    try {
        const pool = await sql.connect(config);
        console.log('Connected to SQL Server');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
}
module.exports = { connectToDatabase, sql };
