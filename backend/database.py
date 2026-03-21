"""SQLite database setup and management"""
import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "megladon_md.db")

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
    discord_channel_id TEXT,
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

CREATE TABLE IF NOT EXISTS gov_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drug_name TEXT NOT NULL,
    ceiling_price INTEGER NOT NULL,
    unit TEXT DEFAULT 'VND',
    source TEXT DEFAULT 'dav.gov.vn',
    effective_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gov_prices_drug ON gov_prices(drug_name);
"""

GOV_PRICES = [
    ("Metformin 500mg", 1500, "VND", "dav.gov.vn", "2024-01-01"),
    ("Paracetamol 500mg", 500, "VND", "dav.gov.vn", "2024-01-01"),
    ("Amoxicillin 500mg", 2000, "VND", "dav.gov.vn", "2024-01-01"),
    ("Losartan 50mg", 3000, "VND", "dav.gov.vn", "2024-01-01"),
    ("Omeprazole 20mg", 2500, "VND", "dav.gov.vn", "2024-01-01"),
]

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
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA busy_timeout=5000")
    return db


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA busy_timeout=5000")
        await db.executescript(SCHEMA)
        for source in SEED_SOURCES:
            await db.execute(
                "INSERT OR IGNORE INTO sources (id, name, base_url, search_url_template, store_count) VALUES (?, ?, ?, ?, ?)",
                source,
            )
        for gp in GOV_PRICES:
            await db.execute(
                "INSERT OR IGNORE INTO gov_prices (drug_name, ceiling_price, unit, source, effective_date) VALUES (?, ?, ?, ?, ?)",
                gp,
            )
        await db.commit()


async def check_price_compliance(drug_query: str, unit_price: float) -> dict | None:
    """Check if a unit price exceeds the government ceiling price."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        # Fuzzy match on drug name
        row = await db.execute_fetchone(
            "SELECT * FROM gov_prices WHERE ? LIKE '%' || drug_name || '%' OR drug_name LIKE '%' || ? || '%' LIMIT 1",
            (drug_query, drug_query),
        )
        if row:
            ceiling = row["ceiling_price"]
            if unit_price > ceiling:
                delta_pct = round((unit_price - ceiling) / ceiling * 100, 1)
                return {
                    "drug": row["drug_name"],
                    "ceiling_price": ceiling,
                    "actual_unit_price": round(unit_price, 1),
                    "delta_percent": delta_pct,
                    "source": row["source"],
                    "above_ceiling": True,
                }
            return {
                "drug": row["drug_name"],
                "ceiling_price": ceiling,
                "actual_unit_price": round(unit_price, 1),
                "delta_percent": 0,
                "above_ceiling": False,
            }
    return None
