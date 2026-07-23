import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "smc_hoarding_db",
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;