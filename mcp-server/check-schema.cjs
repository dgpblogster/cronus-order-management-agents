const sql = require('mssql');
require('dotenv').config();

async function checkSchema() {
  const pool = await sql.connect({
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: { trustServerCertificate: true }
  });

  const tables = ['Customers', 'CreditProfiles', 'Products', 'Inventory', 'Pricing', 'OrderHistory'];
  
  for (const table of tables) {
    const result = await pool.request().query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}' ORDER BY ORDINAL_POSITION`
    );
    console.log(`\n${table}:`);
    result.recordset.forEach(c => console.log(`  ${c.COLUMN_NAME}`));
  }
  
  await pool.close();
}

checkSchema().catch(console.error);
