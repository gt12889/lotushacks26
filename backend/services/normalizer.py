"""Drug name normalization and fuzzy matching"""
import re


def normalize_drug_name(name: str) -> str:
    """Normalize a drug name for matching."""
    name = name.lower().strip()
    name = re.sub(r'\s+', ' ', name)
    # Remove common Vietnamese packaging words
    for word in ['hộp', 'viên', 'vỉ', 'chai', 'tuýp', 'gói', 'ống']:
        name = name.replace(word, '')
    name = re.sub(r'[()]', '', name)
    return name.strip()


def extract_dosage(name: str) -> str | None:
    """Extract dosage from drug name (e.g., '500mg')."""
    match = re.search(r'(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg|iu)', name, re.IGNORECASE)
    if match:
        return f"{match.group(1)}{match.group(2).lower()}"
    return None


def fuzzy_match_score(query: str, product_name: str) -> float:
    """Simple fuzzy match score between query and product name."""
    q = normalize_drug_name(query).split()
    p = normalize_drug_name(product_name).split()
    if not q:
        return 0.0
    matches = sum(1 for word in q if any(word in pw for pw in p))
    return matches / len(q)
