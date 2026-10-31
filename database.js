
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'volt.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', err.message);
    } else {
        console.log('تم الاتصال بقاعدة البيانات بنجاح.');
    }
});

// إنشاء الجدول فوراً وبشكل مؤكد
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL DEFAULT 0,
        category TEXT DEFAULT 'عام',
        image_url TEXT,
        stock_quantity INTEGER DEFAULT 0
    )`, (err) => {
        if (err) {
            console.error('خطأ أثناء إنشاء جدول المنتجات:', err.message);
        } else {
            console.log('جدول المنتجات جاهز وبأعمدة مكتملة.');
        }
    });
});

module.exports = db;