import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, 'cyber2.db');

export async function getDbConnection() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

export async function initDb() {
  const db = await getDbConnection();

  // Create Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      balance REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Orders table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      listing_title TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price_paid REAL NOT NULL,
      margin_earned REAL NOT NULL,
      accounts_data TEXT NOT NULL,
      purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      order_type TEXT DEFAULT 'account',
      link TEXT DEFAULT NULL,
      provider_order_id INTEGER DEFAULT NULL,
      remains INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Completed',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Migration for SMM columns on orders table
  const columns = await db.all('PRAGMA table_info(orders)');
  const columnNames = columns.map(c => c.name);
  if (!columnNames.includes('order_type')) {
    await db.exec("ALTER TABLE orders ADD COLUMN order_type TEXT DEFAULT 'account'");
  }
  if (!columnNames.includes('link')) {
    await db.exec("ALTER TABLE orders ADD COLUMN link TEXT DEFAULT NULL");
  }
  if (!columnNames.includes('provider_order_id')) {
    await db.exec("ALTER TABLE orders ADD COLUMN provider_order_id INTEGER DEFAULT NULL");
  }
  if (!columnNames.includes('remains')) {
    await db.exec("ALTER TABLE orders ADD COLUMN remains INTEGER DEFAULT 0");
  }
  if (!columnNames.includes('status')) {
    await db.exec("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'Completed'");
  }

  // Create Deposits table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_id TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create Settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Create Support Tickets table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Populate default settings if empty
  const defaultSettings = [
    { key: 'accsbulk_api_key', value: 'acb_Jhq3gKPLjGgEaBjkhW3sknLPrFRdJSILTaw79ckwB1QCk7ax' },
    { key: 'accsbulk_base_url', value: 'https://accsbulk.com/api/v1' },
    { key: 'markup_percent', value: '15' },
    { key: 'wow_smm_api_key', value: '09ee1dfc0f11b367cecc8ef2df20ab9b' },
    { key: 'smm_base_url', value: 'https://wowsmmpanel.com/api/v2' },
    { key: 'smm_markup_percent', value: '20' },
    { key: 'payment_bkash', value: 'bKash Personal: 017XXXXXXXX' },
    { key: 'payment_nagad', value: 'Nagad Personal: 019XXXXXXXX' },
    { key: 'payment_crypto', value: 'USDT (TRC20): Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }
  ];

  for (const setting of defaultSettings) {
    const row = await db.get('SELECT * FROM settings WHERE key = ?', [setting.key]);
    if (!row) {
      await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [setting.key, setting.value]);
    }
  }

  // Create default admin user if not exists
  const adminEmail = 'admin@cyber2.com';
  const adminRow = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
  if (!adminRow) {
    // We will hash this in server.js or hash it here. Let's use a standard bcrypt pre-hashed value for 'admin123'
    // '$2a$10$X8OsnM47/u97wE0e6LqWzO0Wj.m8yW5fJbUv29GgejSj7D6i9k5vK' is 'admin123'
    const adminPasswordHash = '$2a$10$X8OsnM47/u97wE0e6LqWzO0Wj.m8yW5fJbUv29GgejSj7D6i9k5vK';
    await db.run(
      'INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)',
      ['CYBER2 Admin', adminEmail, adminPasswordHash, 'admin', 1000.0]
    );
    console.log('Created default admin: admin@cyber2.com / admin123');
  }

  await db.close();
}
