"""Seed realistic Vietnamese pharmacy price data for demo.

Populates the prices table with realistic data for all 5 quick-scan drugs
across all 5 pharmacy chains, with price variance that demonstrates the
100-300% markup problem MegalodonMD solves.

Run: python3 seed_demo_data.py
"""
import sqlite3
import random
from datetime import datetime, timedelta

DB_PATH = "megladon_md.db"

# 5 pharmacy sources (matching sources table)
SOURCES = {
    "long_chau": "FPT Long Chau",
    "pharmacity": "Pharmacity",
    "an_khang": "An Khang",
    "than_thien": "Nha Thuoc Than Thien",
    "medicare": "Medicare Vietnam",
}

# Realistic Vietnamese pharmacy drug catalog
# Format: (drug_query, product_name, manufacturer, pack_size, base_price_vnd)
# Prices are realistic VND retail prices from Vietnamese pharmacy chains
DRUG_CATALOG = [
    # === Paracetamol 500mg ===
    ("Paracetamol 500mg", "Paracetamol 500mg Nadyphar (hộp 100 viên)", "Nadyphar", 100, 15000),
    ("Paracetamol 500mg", "Panadol Extra 500mg (hộp 12 viên)", "GSK", 12, 28000),
    ("Paracetamol 500mg", "Efferalgan 500mg (hộp 16 viên sủi)", "UPSA", 16, 65000),
    ("Paracetamol 500mg", "Hapacol 500mg (hộp 100 viên)", "DHG Pharma", 100, 22000),
    ("Paracetamol 500mg", "Tylenol 500mg (hộp 10 viên)", "Johnson & Johnson", 10, 35000),
    ("Paracetamol 500mg", "Paracetamol Stada 500mg (hộp 100 viên)", "Stada", 100, 18000),

    # === Amoxicillin 500mg ===
    ("Amoxicillin 500mg", "Amoxicillin 500mg Domesco (hộp 100 viên)", "Domesco", 100, 85000),
    ("Amoxicillin 500mg", "Amoxicillin 500mg Vidipha (hộp 100 viên)", "Vidipha", 100, 72000),
    ("Amoxicillin 500mg", "Amoxil 500mg (hộp 12 viên)", "GSK", 12, 45000),
    ("Amoxicillin 500mg", "Amoxicillin 500mg TV.Pharm (hộp 100 viên)", "TV.Pharm", 100, 68000),
    ("Amoxicillin 500mg", "Ospamox 500mg (hộp 12 viên)", "Sandoz", 12, 52000),

    # === Losartan 50mg ===
    ("Losartan 50mg", "Losartan Stada 50mg (hộp 30 viên)", "Stada", 30, 65000),
    ("Losartan 50mg", "Cozaar 50mg (hộp 30 viên)", "MSD", 30, 185000),
    ("Losartan 50mg", "Losartan 50mg Domesco (hộp 30 viên)", "Domesco", 30, 55000),
    ("Losartan 50mg", "Losartan 50mg TV.Pharm (hộp 30 viên)", "TV.Pharm", 30, 48000),
    ("Losartan 50mg", "Losartan Kali 50mg Savi (hộp 30 viên)", "Savipharm", 30, 72000),

    # === Omeprazole 20mg ===
    ("Omeprazole 20mg", "Omeprazole 20mg Domesco (hộp 30 viên)", "Domesco", 30, 35000),
    ("Omeprazole 20mg", "Losec 20mg (hộp 14 viên)", "AstraZeneca", 14, 125000),
    ("Omeprazole 20mg", "Omeprazole Stada 20mg (hộp 30 viên)", "Stada", 30, 42000),
    ("Omeprazole 20mg", "Omeprazole 20mg TV.Pharm (hộp 30 viên)", "TV.Pharm", 30, 28000),
    ("Omeprazole 20mg", "Omez 20mg (hộp 30 viên)", "Dr. Reddy's", 30, 95000),

    # === Extra Metformin variants (fill gaps) ===
    ("Metformin 500mg", "Metformin 500mg Vidipha (hộp 100 viên)", "Vidipha", 100, 32000),
    ("Metformin 500mg", "Glucophage 850mg (hộp 30 viên)", "Merck", 30, 110000),
]

# Price variance by pharmacy (multiplier range)
# Simulates the real 100-300% price variance across Vietnamese pharmacies
PHARMACY_PRICE_VARIANCE = {
    "long_chau": (0.85, 1.05),    # Usually competitive
    "pharmacity": (0.95, 1.25),   # Mid-range
    "an_khang": (1.00, 1.35),     # Slightly higher
    "than_thien": (0.80, 1.10),   # Sometimes cheapest
    "medicare": (1.10, 1.50),     # Premium pricing
}


def seed_prices(db: sqlite3.Connection):
    """Insert realistic price data with variance across pharmacies and time."""
    # Clear previously seeded data to avoid duplicates (preserve real scraped data)
    seeded_queries = (
        'Paracetamol 500mg', 'Amoxicillin 500mg', 'Losartan 50mg',
        'Omeprazole 20mg', 'Metformin 500mg',
    )
    placeholders = ','.join('?' for _ in seeded_queries)
    db.execute(f"DELETE FROM prices WHERE drug_query IN ({placeholders})", seeded_queries)

    now = datetime.now()
    inserted = 0

    for drug_query, product_name, manufacturer, pack_size, base_price in DRUG_CATALOG:
        for source_id, source_name in SOURCES.items():
            low, high = PHARMACY_PRICE_VARIANCE[source_id]

            # Skip some products randomly (not every pharmacy carries everything)
            if random.random() < 0.12:
                continue

            # Generate 6-10 price observations over the past 30 days (for trends)
            num_observations = random.randint(6, 10)
            for obs_idx in range(num_observations):
                # Spread observations over past 30 days
                hours_ago = random.randint(0, 720)
                observed_at = now - timedelta(hours=hours_ago)
                days_ago = hours_ago / 24

                # Apply pharmacy-specific variance + small time variance
                variance = random.uniform(low, high)
                time_drift = random.uniform(-0.03, 0.03)  # ±3% price drift
                # Subtle upward price trend: older observations are slightly cheaper
                trend_factor = 1 + (days_ago / 300)
                price = int(base_price * (variance + time_drift) * trend_factor)

                # Round to nearest 1000 VND (realistic)
                price = max(1000, round(price / 1000) * 1000)

                unit_price = round(price / pack_size, 1)
                in_stock = 1 if random.random() > 0.08 else 0  # 8% out of stock

                # Realistic product URLs
                url_slug = product_name.lower().replace(" ", "-").replace("(", "").replace(")", "")
                pharmacy_urls = {
                    "long_chau": f"https://nhathuoclongchau.com.vn/{url_slug}",
                    "pharmacity": f"https://pharmacity.vn/{url_slug}",
                    "an_khang": f"https://ankhang.vn/{url_slug}",
                    "than_thien": f"https://nhathuocthanhtien.vn/{url_slug}",
                    "medicare": f"https://medicare.vn/{url_slug}",
                }

                # Some products have original (pre-discount) prices
                original_price = None
                if random.random() < 0.25:
                    original_price = int(price * random.uniform(1.10, 1.30))
                    original_price = round(original_price / 1000) * 1000

                db.execute(
                    """INSERT INTO prices
                       (drug_query, source_id, product_name, price, original_price,
                        pack_size, unit_price, manufacturer, in_stock, product_url, observed_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        drug_query, source_id, product_name, price, original_price,
                        pack_size, unit_price, manufacturer, in_stock,
                        pharmacy_urls[source_id],
                        observed_at.strftime("%Y-%m-%d %H:%M:%S"),
                    ),
                )
                inserted += 1

    return inserted


def fix_gov_prices(db: sqlite3.Connection):
    """Remove duplicate gov_prices and add unique constraint."""
    # Get distinct entries
    rows = db.execute("SELECT DISTINCT drug_name, ceiling_price, unit, source, effective_date FROM gov_prices").fetchall()

    # Recreate table with unique constraint
    db.execute("DROP TABLE IF EXISTS gov_prices")
    db.execute("""
        CREATE TABLE gov_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            drug_name TEXT NOT NULL UNIQUE,
            ceiling_price INTEGER NOT NULL,
            unit TEXT DEFAULT 'VND',
            source TEXT DEFAULT 'dav.gov.vn',
            effective_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    db.execute("CREATE INDEX IF NOT EXISTS idx_gov_prices_drug ON gov_prices(drug_name)")

    # Re-insert unique entries
    for row in rows:
        db.execute(
            "INSERT OR IGNORE INTO gov_prices (drug_name, ceiling_price, unit, source, effective_date) VALUES (?, ?, ?, ?, ?)",
            row,
        )

    return len(rows)


def main():
    db = sqlite3.connect(DB_PATH)

    # Fix gov_prices duplicates
    gov_count = fix_gov_prices(db)
    print(f"Gov prices cleaned: {gov_count} unique entries")

    # Seed price data
    count = seed_prices(db)
    print(f"Seeded {count} price observations")

    db.commit()

    # Summary
    print("\n=== DB Summary ===")
    for row in db.execute("SELECT drug_query, COUNT(*) as cnt, COUNT(DISTINCT source_id) as sources FROM prices GROUP BY drug_query ORDER BY drug_query"):
        print(f"  {row[0]}: {row[1]} rows, {row[2]} sources")
    total = db.execute("SELECT COUNT(*) FROM prices").fetchone()[0]
    unique = db.execute("SELECT COUNT(DISTINCT product_name) FROM prices").fetchone()[0]
    print(f"\nTotal: {total} rows, {unique} unique products")

    db.close()


if __name__ == "__main__":
    main()
