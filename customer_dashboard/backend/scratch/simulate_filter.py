import urllib.request
import json

def fetch_json(url):
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return {}

cats_res = fetch_json('http://localhost:8000/api/v1/categories/?page_size=200')
prods_res = fetch_json('http://localhost:8000/api/v1/products/?page_size=200')

cats = cats_res.get('data', [])
prods = prods_res.get('data', [])

print(f"Fetched {len(cats)} categories, {len(prods)} products.")

# 1. Map products exactly as frontend does:
mapped_prods = []
for p in prods:
    cat_id = p.get('category')
    cat_node = next((c for c in cats if str(c.get('id')) == str(cat_id)), None)

    main_cat = 'Other'
    sub_cat = None
    sub_item = None

    if cat_node:
        depth = cat_node.get('depth')
        if depth == 2:
            sub_item = cat_node.get('name')
            p1 = next((c for c in cats if str(c.get('id')) == str(cat_node.get('parent'))), None)
            if p1:
                sub_cat = p1.get('name')
                p2 = next((c for c in cats if str(c.get('id')) == str(p1.get('parent'))), None)
                if p2:
                    main_cat = p2.get('name')
                else:
                    main_cat = p1.get('name')
        elif depth == 1:
            sub_cat = cat_node.get('name')
            p1 = next((c for c in cats if str(c.get('id')) == str(cat_node.get('parent'))), None)
            if p1:
                main_cat = p1.get('name')
            else:
                main_cat = cat_node.get('name')
        else:
            main_cat = cat_node.get('name')

    mapped_prods.append({
        'id': p.get('slug'),
        'title': p.get('name'),
        'category': main_cat,
        'subCategory': sub_cat,
        'subItem': sub_item,
        'status': p.get('status'),
    })

print("\nMapped Products:")
for mp in mapped_prods:
    print(f"  {mp['title']} -> Category: '{mp['category']}' | SubCategory: '{mp['subCategory']}' | SubItem: '{mp['subItem']}'")

# 2. Filter function simulating the frontend categoryProducts hook
def get_category_products(category_name, db_products, db_categories):
    result = list(db_products)
    
    # We simulate loading = False, so we don't return []
    name_lower = category_name.lower()
    matched = next((c for c in db_categories if c.get('name').lower() == name_lower), None)
    
    if matched:
        depth = matched.get('depth')
        main_category = None
        sub_category_name = None
        sub_item_name = None
        
        if depth == 2:
            sub_item_name = matched.get('name')
            p1 = next((c for c in db_categories if str(c.get('id')) == str(matched.get('parent'))), None)
            sub_category_name = p1.get('name') if p1 else None
            p2 = next((c for c in db_categories if str(c.get('id')) == str(p1.get('parent'))), None) if p1 else None
            main_category = p2.get('name') if p2 else (p1.get('name') if p1 else matched.get('name'))
        elif depth == 1:
            sub_category_name = matched.get('name')
            p1 = next((c for c in db_categories if str(c.get('id')) == str(matched.get('parent'))), None)
            main_category = p1.get('name') if p1 else matched.get('name')
        else:
            main_category = matched.get('name')
            
        filtered = [p for p in result if p['category'] == main_category]
        if sub_category_name:
            filtered = [p for p in filtered if p['subCategory'] == sub_category_name]
        if sub_item_name:
            filtered = [p for p in filtered if p['subItem'] == sub_item_name]
            
        if not sub_category_name and not sub_item_name and len(filtered) == 0:
            filtered = [p for p in result if p['category'] == matched.get('name') or p['category'] == main_category]
            
        return filtered

    # Fallback resolveCategory logic
    # In JS/TS resolveCategory uses keyword matches to return {mainCategory, subCategoryName, subItemName, brandName}
    # Let's mock resolveCategory
    resolved_main = "Advanced Dental Equipment & Accessories"
    resolved_sub = None
    resolved_sub_item = None
    resolved_brand = None
    
    if "handpiece" in name_lower or name_lower == "handpieces" or "turbine" in name_lower or "motor" in name_lower or "contra-angle" in name_lower:
        resolved_main = "Dental Handpieces"
    elif "camera" in name_lower or "intraoral camera" in name_lower:
        resolved_main = "Intraoral Cameras"
    elif "curing" in name_lower or "cure" in name_lower or "composite" in name_lower or "glass ionomer" in name_lower or "bonding" in name_lower or "etching" in name_lower or "light" in name_lower:
        resolved_main = "LED Light Cure Units"
    elif "chair" in name_lower or "stool" in name_lower or "seating" in name_lower:
        resolved_main = "Dental Chairs"
    elif "compressor" in name_lower or "suction" in name_lower or "vacuum" in name_lower or "pump" in name_lower:
        resolved_main = "Dental Air Compressors"
    elif "imaging" in name_lower or "x-ray" in name_lower or "sensor" in name_lower or "cbct" in name_lower or "opg" in name_lower or "scanner" in name_lower:
        resolved_main = "3D Oral Scanners"
        
    main_cat_products = [p for p in result if p['category'] == resolved_main]
    return main_cat_products

test_categories = [
    "Dental Handpieces",
    "High-Speed Handpieces",
    "Air Turbines",
    "Low-Speed Handpieces",
    "Contra-Angles",
    "LED Light Cure Units",
    "Cordless Curing Units",
    "dental-handpieces", # slug check
    "air-turbines" # slug check
]

print("\nTesting Filters:")
for tc in test_categories:
    res = get_category_products(tc, mapped_prods, cats)
    print(f"Category '{tc}' -> Found {len(res)} products:")
    for r in res:
        print(f"  - {r['title']}")
