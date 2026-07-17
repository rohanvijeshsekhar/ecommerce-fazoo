import os
import sys
import django
import urllib.request
import json

# Setup django environment
sys.path.append('c:\\Users\\HP\\OneDrive\\Desktop\\customer_dashboard01\\customer_dashboard\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.products.models import Product
from apps.homepage.models import BestSeller, RecommendedProduct, FeaturedCollection, FeaturedCollectionItem

# Get the first active product
prod = Product.objects.filter(status="active", is_deleted=False).first()
if not prod:
    print("No active product found to test.")
    sys.exit(0)

print(f"Using test product: '{prod.name}' (SKU: {prod.sku})")

# Create temporary entries
bs = BestSeller.objects.create(product=prod, custom_heading="Test Bestseller Product", short_description="Test short desc", is_visible=True)
rec = RecommendedProduct.objects.create(product=prod, is_visible=True)
col = FeaturedCollection.objects.create(title="Test Featured Collection", is_visible=True)
col_item = FeaturedCollectionItem.objects.create(collection=col, product=prod)

print("Created temporary CMS database entries.")

def check_api(url):
    try:
        with urllib.request.urlopen(url) as response:
            res = json.loads(response.read().decode())
            data = res.get('data', [])
            print(f"\nAPI {url} returned {len(data)} items.")
            if data:
                item = data[0]
                # If featured-collections, look inside items
                if 'items' in item:
                    print("Found Featured Collection items:")
                    for sub in item['items']:
                        print("  Sub item keys:", sub.keys())
                        print("  Sub item pricing:", sub.get('pricing'))
                        print("  Sub item inventory:", sub.get('inventory'))
                else:
                    print("Item keys:", item.keys())
                    print("  Pricing:", item.get('pricing'))
                    print("  Inventory:", item.get('inventory'))
    except Exception as e:
        print(f"Error testing {url}: {e}")

try:
    check_api('http://localhost:8000/api/v1/homepage/best-sellers/')
    check_api('http://localhost:8000/api/v1/homepage/recommended/')
    check_api('http://localhost:8000/api/v1/homepage/featured-collections/')
finally:
    # Cleanup
    bs.delete()
    rec.delete()
    col_item.delete()
    col.delete()
    print("\nTemporary entries cleaned up successfully.")
