import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbConnection, initDb } from './database.js';
import {
  checkApiConnection,
  getAccsBulkCategories,
  getAccsBulkSubcategories,
  getAccsBulkListings,
  getAccsBulkListingDetail,
  purchaseListing
} from './api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'cyber2-super-secret-key-1337!';

app.use(cors());
app.use(express.json());

// Initialize Database
await initDb();

// --- Helper Functions ---
function applyMarkup(price, markupPercent) {
  const p = parseFloat(price);
  if (isNaN(p)) return '0.00';
  return (p * (1 + parseFloat(markupPercent) / 100)).toFixed(2);
}

// Authentication Middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Admin Middleware
async function requireAdmin(req, res, next) {
  await authenticateToken(req, res, async () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin privileges required' });
    }
    next();
  });
}

// --- Auth Routes ---
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }

  const db = await getDbConnection();
  try {
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'user', 0.0]
    );

    const newUser = await db.get('SELECT id, name, email, role, balance FROM users WHERE id = ?', [result.lastID]);
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const db = await getDbConnection();
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  const db = await getDbConnection();
  try {
    const user = await db.get('SELECT id, name, email, role, balance, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

// --- Public Listings Routes (with Markup) ---
app.get('/api/categories', async (req, res) => {
  const db = await getDbConnection();
  try {
    const categoriesData = await getAccsBulkCategories(db);
    res.json(categoriesData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.get('/api/categories/:id/subcategories', async (req, res) => {
  const db = await getDbConnection();
  try {
    const subcategoriesData = await getAccsBulkSubcategories(db, req.params.id);
    res.json(subcategoriesData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.get('/api/listings', async (req, res) => {
  const db = await getDbConnection();
  try {
    const markupRow = await db.get("SELECT value FROM settings WHERE key = 'markup_percent'");
    const markupPercent = markupRow ? parseFloat(markupRow.value) : 15;

    const listingsData = await getAccsBulkListings(db, req.query);

    // Apply markup to listing prices
    if (listingsData.success && Array.isArray(listingsData.data)) {
      listingsData.data = listingsData.data.map(listing => ({
        ...listing,
        original_price: listing.price, // keep track of original
        price: applyMarkup(listing.price, markupPercent)
      }));
    }

    res.json(listingsData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.get('/api/listings/:slug', async (req, res) => {
  const db = await getDbConnection();
  try {
    const markupRow = await db.get("SELECT value FROM settings WHERE key = 'markup_percent'");
    const markupPercent = markupRow ? parseFloat(markupRow.value) : 15;

    const detailData = await getAccsBulkListingDetail(db, req.params.slug);

    if (detailData.success && detailData.data) {
      detailData.data.original_price = detailData.data.price;
      detailData.data.price = applyMarkup(detailData.data.price, markupPercent);
    }

    res.json(detailData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

// --- Purchase Route ---
app.post('/api/purchase', authenticateToken, async (req, res) => {
  const { ad_id, quantity, listing_slug } = req.body;
  if (!ad_id || !quantity || !listing_slug) {
    return res.status(400).json({ success: false, message: 'ad_id, quantity and listing_slug are required' });
  }

  const db = await getDbConnection();
  try {
    // 1. Get current markup
    const markupRow = await db.get("SELECT value FROM settings WHERE key = 'markup_percent'");
    const markupPercent = markupRow ? parseFloat(markupRow.value) : 15;

    // 2. Fetch fresh listing details from provider to check price/stock
    const detailData = await getAccsBulkListingDetail(db, listing_slug);
    if (!detailData.success || !detailData.data) {
      return res.status(400).json({ success: false, message: 'Could not fetch listing details from provider' });
    }

    const listing = detailData.data;
    const originalPrice = parseFloat(listing.price);
    const userPrice = parseFloat(applyMarkup(originalPrice, markupPercent));
    const totalUserCost = userPrice * parseInt(quantity);
    const totalOriginalCost = originalPrice * parseInt(quantity);
    const marginEarned = totalUserCost - totalOriginalCost;

    if (listing.available_stock < parseInt(quantity)) {
      return res.status(400).json({ success: false, message: `Insufficient stock on provider. Available: ${listing.available_stock}` });
    }

    // 3. Verify user balance
    const user = await db.get('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    if (user.balance < totalUserCost) {
      return res.status(400).json({ success: false, message: `Insufficient wallet balance. You need $${totalUserCost.toFixed(2)}, current balance is $${user.balance.toFixed(2)}` });
    }

    // 4. Temporarily deduct user balance
    await db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [totalUserCost, req.user.id]);

    // 5. Call Provider API to purchase
    try {
      const apiResult = await purchaseListing(db, ad_id, quantity);
      
      if (apiResult.success && apiResult.data) {
        const accountsList = apiResult.data.accounts;

        // Save order to db
        await db.run(
          `INSERT INTO orders (user_id, listing_id, listing_title, quantity, price_paid, margin_earned, accounts_data) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            ad_id,
            listing.title,
            parseInt(quantity),
            totalUserCost,
            marginEarned,
            JSON.stringify(accountsList)
          ]
        );

        res.json({
          success: true,
          message: 'Purchase successful',
          data: {
            order_id: apiResult.data.order_id,
            listing: listing.title,
            quantity: parseInt(quantity),
            amount: totalUserCost.toFixed(2),
            accounts: accountsList,
            purchased_at: new Date().toISOString()
          }
        });
      } else {
        throw new Error(apiResult.message || 'API Purchase failed');
      }
    } catch (apiError) {
      // Refund balance on API purchase failure
      await db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [totalUserCost, req.user.id]);
      return res.status(500).json({ success: false, message: `Provider Purchase Error: ${apiError.message}` });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

// --- Order Routes ---
app.get('/api/orders', authenticateToken, async (req, res) => {
  const db = await getDbConnection();
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await db.all(`
        SELECT o.*, u.name as user_name, u.email as user_email 
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.purchased_at DESC
      `);
    } else {
      orders = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY purchased_at DESC', [req.user.id]);
    }
    
    // Parse JSON string back to array
    orders = orders.map(order => ({
      ...order,
      accounts_data: JSON.parse(order.accounts_data)
    }));

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

// --- Deposit Routes ---
app.post('/api/deposits', authenticateToken, async (req, res) => {
  const { amount, payment_method, transaction_id } = req.body;
  if (!amount || !payment_method || !transaction_id) {
    return res.status(400).json({ success: false, message: 'amount, payment_method and transaction_id are required' });
  }

  const db = await getDbConnection();
  try {
    // Check for duplicate TxID
    const existingTx = await db.get('SELECT * FROM deposits WHERE transaction_id = ?', [transaction_id]);
    if (existingTx) {
      return res.status(400).json({ success: false, message: 'This Transaction ID has already been submitted' });
    }

    await db.run(
      'INSERT INTO deposits (user_id, amount, payment_method, transaction_id, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, parseFloat(amount), payment_method, transaction_id, 'pending']
    );

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully. Waiting for admin approval.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.get('/api/deposits', authenticateToken, async (req, res) => {
  const db = await getDbConnection();
  try {
    const deposits = await db.all('SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, data: deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

// --- Admin Settings Routes ---
app.get('/api/admin/settings', requireAdmin, async (req, res) => {
  const db = await getDbConnection();
  try {
    const settings = await db.all('SELECT * FROM settings');
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json({ success: true, data: settingsMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.post('/api/admin/settings', requireAdmin, async (req, res) => {
  const db = await getDbConnection();
  try {
    const settings = req.body; // e.g. { accsbulk_api_key: '...', markup_percent: '15', ... }
    for (const [key, value] of Object.entries(settings)) {
      await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
    }
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

// --- Admin User & Balance Management ---
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const db = await getDbConnection();
  try {
    const users = await db.all('SELECT id, name, email, role, balance, created_at FROM users');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.post('/api/admin/users/:id/balance', requireAdmin, async (req, res) => {
  const { amount, action } = req.body; // action: 'add' or 'deduct' or 'set'
  if (amount === undefined || !action) {
    return res.status(400).json({ success: false, message: 'amount and action are required' });
  }

  const db = await getDbConnection();
  try {
    const userId = req.params.id;
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let newBalance = user.balance;
    const change = parseFloat(amount);

    if (action === 'add') {
      newBalance += change;
    } else if (action === 'deduct') {
      newBalance -= change;
    } else if (action === 'set') {
      newBalance = change;
    }

    await db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId]);
    res.json({ success: true, message: `Balance updated to $${newBalance.toFixed(2)}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

// --- Admin Deposit Management ---
app.get('/api/admin/deposits', requireAdmin, async (req, res) => {
  const db = await getDbConnection();
  try {
    const deposits = await db.all(`
      SELECT d.*, u.name as user_name, u.email as user_email 
      FROM deposits d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `);
    res.json({ success: true, data: deposits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.post('/api/admin/deposits/:id/approve', requireAdmin, async (req, res) => {
  const db = await getDbConnection();
  try {
    const depositId = req.params.id;
    const deposit = await db.get('SELECT * FROM deposits WHERE id = ?', [depositId]);
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit request not found' });
    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Deposit request is already ${deposit.status}` });
    }

    // Update deposit status
    await db.run("UPDATE deposits SET status = 'approved' WHERE id = ?", [depositId]);
    
    // Add balance to user
    await db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [deposit.amount, deposit.user_id]);

    res.json({ success: true, message: 'Deposit approved and user balance updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.post('/api/admin/deposits/:id/reject', requireAdmin, async (req, res) => {
  const db = await getDbConnection();
  try {
    const depositId = req.params.id;
    const deposit = await db.get('SELECT * FROM deposits WHERE id = ?', [depositId]);
    if (!deposit) return res.status(404).json({ success: false, message: 'Deposit request not found' });
    if (deposit.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Deposit request is already ${deposit.status}` });
    }

    await db.run("UPDATE deposits SET status = 'rejected' WHERE id = ?", [depositId]);
    res.json({ success: true, message: 'Deposit request rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

// --- Admin Stats ---
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  const db = await getDbConnection();
  try {
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    const totalResellOrders = await db.get('SELECT COUNT(*) as count, SUM(price_paid) as revenue, SUM(margin_earned) as profit FROM orders');
    const pendingDeposits = await db.get('SELECT COUNT(*) as count FROM deposits WHERE status = "pending"');
    
    // Check accsbulk connection & balance
    let providerBalance = 'N/A';
    let providerStatus = 'Disconnected';
    try {
      const conn = await checkApiConnection(db);
      if (conn.success) {
        providerBalance = conn.balance;
        providerStatus = 'Connected';
      } else {
        providerStatus = `Error: ${conn.message}`;
      }
    } catch (e) {
      providerStatus = `Error: ${e.message}`;
    }

    res.json({
      success: true,
      data: {
        total_users: totalUsers.count,
        total_orders: totalResellOrders.count || 0,
        revenue: (totalResellOrders.revenue || 0).toFixed(2),
        profit: (totalResellOrders.profit || 0).toFixed(2),
        pending_deposits: pendingDeposits.count,
        provider_balance: providerBalance,
        provider_status: providerStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

// --- Support Tickets Routes ---
app.post('/api/support', async (req, res) => {
  const { user_id, name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email and message are required' });
  }

  const db = await getDbConnection();
  try {
    await db.run(
      'INSERT INTO support_tickets (user_id, name, email, message) VALUES (?, ?, ?, ?)',
      [user_id || null, name, email, message]
    );
    res.status(201).json({ success: true, message: 'Support ticket submitted successfully. We will contact you soon.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.get('/api/admin/support', requireAdmin, async (req, res) => {
  const db = await getDbConnection();
  try {
    const tickets = await db.all('SELECT * FROM support_tickets ORDER BY created_at DESC');
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

app.post('/api/admin/support/:id/resolve', requireAdmin, async (req, res) => {
  const db = await getDbConnection();
  try {
    await db.run("UPDATE support_tickets SET status = 'resolved' WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Support ticket marked as resolved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  } finally {
    await db.close();
  }
});

// Serve static files from the React frontend app in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Send back the index.html for any other request (client-side routing support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
