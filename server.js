
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// الاتصال بقاعدة بيانات SQLite الحية والآمنة
const dbPath = path.resolve(__dirname, 'volt.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ خطأ في الاتصال بقاعدة بيانات SQLite:', err.message);
    } else {
        console.log('✅ تم الاتصال بقاعدة بيانات SQLite بنجاح عبر volt.db');
    }
});

// بناء الهيكلية الهندسية للجداول بقاعدة البيانات مع دعم الموردين
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT,
        description TEXT,
        image TEXT,
        stock INTEGER DEFAULT 10,
        supplierPhone TEXT DEFAULT '213000000000'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER,
        quantity INTEGER,
        status TEXT DEFAULT 'جديد (قيد التوجيه للمورد)',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(productId) REFERENCES products(id)
    )`);
});

// 🤖 أتمتة ذكية: توليد صورة ريندر ثلاثية الأبعاد عالية الجودة حسب اسم المنتج
function getAutoProductImage(productName) {
    const name = (productName || '').toLowerCase();
    if (name.includes('سامسونج') || name.includes('samsung') || name.includes('هاتف') || name.includes('phone') || name.includes('realme') || name.includes('nokia')) {
        return 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80';
    } else if (name.includes('cable') || name.includes('كابل') || name.includes('شحن') || name.includes('charger')) {
        return 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
}

// 🤖 أتمتة ذكية: توليد وصف تسويقي احترافي تلقائياً
function getAutoProductDescription(productName) {
    const name = (productName || '').toLowerCase();
    if (name.includes('سامسونج') || name.includes('samsung') || name.includes('هاتف') || name.includes('phone') || name.includes('realme')) {
        return 'هاتف ذكي بتصميم عصري وأداء فائق السرعة، مزود بشاشة عالية الدقة وكاميرا متطورة لالتقاط أجمل اللحظات مع بطارية تدوم طويلاً.';
    } else if (name.includes('cable') || name.includes('كابل') || name.includes('شحن') || name.includes('charger')) {
        return 'كابل شحن ونقل بيانات فائق السرعة، مصنوع من مواد عالية المتانة ومقاوم للقطع لضمان أفضل أداء وأمان.';
    }
    return 'منتج تقني رقمي عالي الجودة، مصمم خصيصاً ليمنحك كفاءة استثنائية وتجربة استخدامه المتميزة.';
}

// API: جلب المنتجات
app.get('/api/products', (req, res) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: إضافة منتج مع الأتمتة الكاملة وحفظ رقم هاتف المورد الخاص به
app.post('/api/products', (req, res) => {
    let { name, price, category, description, image, stock, supplierPhone } = req.body;
    
    if (!image || image.trim() === '') image = getAutoProductImage(name);
    if (!description || description.trim() === '') description = getAutoProductDescription(name);
    if (!supplierPhone || supplierPhone.trim() === '') supplierPhone = '213000000000';

    const query = `INSERT INTO products (name, price, category, description, image, stock, supplierPhone) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [name, price, category || 'عام', description, image, stock || 10, supplierPhone], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, price, category, description, image, stock, supplierPhone });
    });
});

// API: حذف منتج
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM products WHERE id = ?`, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// API: تسجيل الطلبات المرتبطة بالمنتجات والموردين
app.get('/api/orders', (req, res) => {
    const query = `
        SELECT orders.id, orders.quantity, orders.status, orders.createdAt,
               products.name as productName, products.price as productPrice, products.supplierPhone as supplierPhone
        FROM orders
        LEFT JOIN products ON orders.productId = products.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/orders', (req, res) => {
    const { productId, quantity } = req.body;
    const query = `INSERT INTO orders (productId, quantity) VALUES (?, ?)`;
    db.run(query, [productId, quantity || 1], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, productId, quantity });
    });
});

app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM orders WHERE id = ?`, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 خادم VOLT 2.0 يعمل بنجاح على http://localhost:${PORT}`);
});