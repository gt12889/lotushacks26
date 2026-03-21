"""Drug variant discovery - find generic alternatives from search results"""
import re
import logging
from models.schemas import ProductResult
from services.exa import search_drug_variants

logger = logging.getLogger(__name__)

# Common brand-to-generic mappings for Vietnamese pharmacy market
BRAND_TO_GENERIC = {
    "glucophage": "metformin",
    "panadol": "paracetamol",
    "efferalgan": "paracetamol",
    "tylenol": "paracetamol",
    "augmentin": "amoxicillin",
    "lipitor": "atorvastatin",
    "norvasc": "amlodipine",
    "cozaar": "losartan",
    "zocor": "simvastatin",
    "nexium": "esomeprazole",
    "losec": "omeprazole",
    "viagra": "sildenafil",
    "zithromax": "azithromycin",
    "amoxil": "amoxicillin",
    "flagyl": "metronidazole",
    "ventolin": "salbutamol",
    "voltaren": "diclofenac",
}

# Common Vietnamese generic manufacturers
VN_MANUFACTURERS = ["Stada", "Domesco", "DHG Pharma", "Pymepharco", "Vidipha", "Nadyphar", "TV.Pharm", "Imexpharm", "OPV"]


def extract_variants_from_results(query: str, products: list[ProductResult]) -> list[str]:
    """Extract unique drug variant names from search results for follow-up searches."""
    variants = set()
    query_lower = query.lower()

    for product in products:
        name = product.product_name.lower()

        # Extract the core drug name (first word or brand name before dosage)
        # e.g. "Metformin Stada 500mg" -> "Metformin"
        words = re.split(r'[\s(]+', product.product_name)
        if words:
            core_name = words[0].strip()
            if core_name.lower() != query_lower.split()[0].lower() and len(core_name) > 2:
                variants.add(core_name)

        # Check brand-to-generic mappings
        for brand, generic in BRAND_TO_GENERIC.items():
            if brand in name and generic not in query_lower:
                variants.add(generic.capitalize())
            elif generic in name and generic not in query_lower:
                # Found a generic we didn't search for
                pass

        # Extract manufacturer-specific variants
        if product.manufacturer:
            mfr = product.manufacturer.strip()
            # Create variant search: "drug_name manufacturer"
            dosage_match = re.search(r'(\d+(?:\.\d+)?)\s*(mg|g|ml)', query, re.IGNORECASE)
            dosage = dosage_match.group(0) if dosage_match else ""
            if mfr in VN_MANUFACTURERS:
                variant = f"{query.split()[0]} {mfr} {dosage}".strip()
                if variant.lower() != query_lower:
                    variants.add(variant)

    # Remove the original query and very short strings
    variants = {v for v in variants if len(v) > 2 and v.lower() != query_lower}

    return list(variants)[:5]  # Cap at 5 variants


def suggest_generic_alternatives(query: str) -> list[str]:
    """Suggest generic alternatives for a branded drug name."""
    query_lower = query.lower().split()[0]  # First word
    suggestions = []

    # Check if query is a brand name
    for brand, generic in BRAND_TO_GENERIC.items():
        if brand in query_lower:
            # Extract dosage from original query
            dosage = ""
            match = re.search(r'(\d+(?:\.\d+)?)\s*(mg|g|ml)', query, re.IGNORECASE)
            if match:
                dosage = f" {match.group(0)}"
            suggestions.append(f"{generic.capitalize()}{dosage}")

    # Check if query is a generic - suggest brands
    for brand, generic in BRAND_TO_GENERIC.items():
        if generic in query_lower:
            dosage = ""
            match = re.search(r'(\d+(?:\.\d+)?)\s*(mg|g|ml)', query, re.IGNORECASE)
            if match:
                dosage = f" {match.group(0)}"
            suggestions.append(f"{brand.capitalize()}{dosage}")

    return suggestions[:3]


async def discover_variants_with_exa(query: str, products: list[ProductResult], exa_api_key: str) -> list[str]:
    """Enhanced variant discovery using Exa semantic search + local mappings."""
    local_variants = extract_variants_from_results(query, products)
    generic_suggestions = suggest_generic_alternatives(query)

    # Exa semantic search for additional variants
    exa_variants = await search_drug_variants(query, exa_api_key)

    all_variants = list(set(local_variants + generic_suggestions + exa_variants))
    return all_variants[:5]
