"""SQLite database setup and management"""
import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "mediscrape.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    search_url_template TEXT NOT NULL,
    store_count INTEGER,
    last_scraped_at TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS drugs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    active_ingredient TEXT,
    dosage TEXT,
    dosage_form TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drug_query TEXT NOT NULL,
    source_id TEXT REFERENCES sources(id),
    product_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    original_price INTEGER,
    pack_size INTEGER DEFAULT 1,
    unit_price REAL,
    manufacturer TEXT,
    in_stock BOOLEAN DEFAULT 1,
    product_url TEXT,
    observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drug_query TEXT NOT NULL,
    price_threshold INTEGER,
    telegram_chat_id TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitor_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drug_query TEXT NOT NULL,
    interval_minutes INTEGER DEFAULT 15,
    sources TEXT DEFAULT 'all',
    is_active BOOLEAN DEFAULT 1,
    last_run_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prices_query_source ON prices(drug_query, source_id);
CREATE INDEX IF NOT EXISTS idx_prices_observed ON prices(observed_at);
CREATE INDEX IF NOT EXISTS idx_prices_unit_price ON prices(unit_price);
"""

SEED_SOURCES = [
    ("long_chau", "FPT Long Chau", "https://nhathuoclongchau.com.vn", "https://nhathuoclongchau.com.vn/tim-kiem?key={query}", 2117),
    ("pharmacity", "Pharmacity", "https://www.pharmacity.vn", "https://www.pharmacity.vn/search?q={query}", 957),
    ("an_khang", "An Khang", "https://www.ankhang.vn", "https://www.ankhang.vn/search?q={query}", 527),
    ("than_thien", "Nha Thuoc Than Thien", "https://nhathuocthanhtien.vn", "https://nhathuocthanhtien.vn/?s={query}", 100),
    ("medicare", "Medicare Vietnam", "https://medicare.vn", "https://medicare.vn/search?q={query}", 50),
]


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        for source in SEED_SOURCES:
            await db.execute(
                "INSERT OR IGNORE INTO sources (id, name, base_url, search_url_template, store_count) VALUES (?, ?, ?, ?, ?)",
                source,
            )
        await db.commit()
