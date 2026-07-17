import json
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.brands.models import Brand, BrandDocument, BrandDocumentType
from apps.categories.models import Category
from apps.products.models import Product, ProductImage, ProductAttribute, ProductDocument, ProductStatus, ProductDocumentType

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds the database with premium dental B2B catalogue data."

    def handle(self, *args, **options):
        self.stdout.write("Starting catalogue seeding...")

        # Clear existing catalogue data (excluding users)
        Product.all_objects.all().hard_delete()
        Category.objects.all().update(parent=None)
        Category.objects.all().delete()
        Brand.all_objects.all().hard_delete()
        self.stdout.write("Cleared existing products, categories, and brands.")

        # 1. Fetch or create a system user for audit references
        user = User.objects.filter(role="admin").first() or User.objects.first()
        if not user:
            # Create a fallback admin user if none exists
            user = User.objects.create_superuser(
                username="admin",
                email="admin@faazo.com",
                password="adminpassword",
                role="admin",
                first_name="Faazo",
                last_name="Administrator"
            )
            self.stdout.write("Created fallback admin user admin/adminpassword")

        # 2. Seed Brands
        brands_data = [
            {
                "name": "NSK",
                "description": "Nakanishi Inc. is a Japanese manufacturer of dental handpieces and clinical micrometer instruments.",
                "country_of_origin": "Japan",
                "website_url": "https://www.nsk-dental.com",
                "support_email": "support@nsk-japan.com",
                "support_phone": "+81-289-64-3380",
                "warranty_months_default": 12,
                "is_warranty_transferable": True,
                "warranty_policy_text": "Standard warranty covers manufacturing defects. Bearings are covered for 6 months.",
                "service_policy_text": "Authorized repairs only. Standard repair turnaround is 5 business days.",
                "service_turnaround_days": 5,
                "documentation_url": "https://www.nsk-dental.com/support/manuals/",
                "certifications": [
                    {"name": "ISO 13485", "number": "ISO-9921", "issued_by": "TUV SUD", "valid_until": "2028-12-31"},
                    {"name": "CE Marking", "number": "CE-0197", "issued_by": "EU Notified Body", "valid_until": "2027-06-30"}
                ]
            },
            {
                "name": "W&H",
                "description": "W&H Dentalwerk is an Austrian precision dental manufacturer founded in 1890.",
                "country_of_origin": "Austria",
                "website_url": "https://www.wh.com",
                "support_email": "office.at@wh.com",
                "support_phone": "+43-6274-6236-0",
                "warranty_months_default": 24,
                "is_warranty_transferable": False,
                "warranty_policy_text": "Covers mechanical breakdown when serviced in certified labs.",
                "service_policy_text": "Pick-up service available. Turnaround is 7 business days.",
                "service_turnaround_days": 7,
                "documentation_url": "https://www.wh.com/en_global/service/",
                "certifications": [
                    {"name": "FDA 510k Clearance", "number": "K192837", "issued_by": "US FDA", "valid_until": "2030-01-01"}
                ]
            },
            {
                "name": "Woodpecker",
                "description": "Guilin Woodpecker Medical Instrument Co. is a leading manufacturer of ultrasonic scalers and curing lights.",
                "country_of_origin": "China",
                "website_url": "https://www.glwoodpecker.com",
                "support_email": "support@glwoodpecker.com",
                "support_phone": "+86-773-5827878",
                "warranty_months_default": 12,
                "is_warranty_transferable": False,
                "warranty_policy_text": "Covers main unit PCB and power systems. Handpiece cables covered for 3 months.",
                "service_policy_text": "Local distributor servicing. 3-day turnaround.",
                "service_turnaround_days": 3,
                "documentation_url": "https://www.glwoodpecker.com/download.html",
                "certifications": [
                    {"name": "CDSCO Import License", "number": "IMP-CD-2023-99", "issued_by": "CDSCO India", "valid_until": "2028-03-15"}
                ]
            }
        ]

        created_brands = {}
        for b_data in brands_data:
            brand, created = Brand.objects.get_or_create(
                name=b_data["name"],
                defaults={
                    "description": b_data["description"],
                    "country_of_origin": b_data["country_of_origin"],
                    "website_url": b_data["website_url"],
                    "support_email": b_data["support_email"],
                    "support_phone": b_data["support_phone"],
                    "warranty_months_default": b_data["warranty_months_default"],
                    "is_warranty_transferable": b_data["is_warranty_transferable"],
                    "warranty_policy_text": b_data["warranty_policy_text"],
                    "service_policy_text": b_data["service_policy_text"],
                    "service_turnaround_days": b_data["service_turnaround_days"],
                    "documentation_url": b_data["documentation_url"],
                    "certifications": b_data["certifications"],
                    "created_by": user,
                    "updated_by": user
                }
            )
            created_brands[brand.name] = brand
            
            if created:
                # Add support document
                from apps.brands.models import BrandDocument, BrandDocumentType
                BrandDocument.objects.create(
                    brand=brand,
                    title=f"{brand.name} Corporate Catalogue 2026",
                    document_type=BrandDocumentType.CATALOGUE,
                    external_url="https://faazo-assets.s3.amazonaws.com/manuals/sample.pdf",
                    is_public=True,
                    created_by=user,
                    updated_by=user
                )
                self.stdout.write(f"Seeded Brand: {brand.name}")

        # 3. Seed Categories
        categories_data = [
            # Roots
            {"name": "Dental Handpieces", "parent": None, "sort_order": 1, "description": "High and low speed surgical dental drills and motors."},
            {"name": "Intraoral Cameras", "parent": None, "sort_order": 2, "description": "HD diagnostic cameras and visualization equipment."},
            {"name": "LED Light Cure Units", "parent": None, "sort_order": 3, "description": "Broadband polymerization curing lights."},
            {"name": "Dental Chairs", "parent": None, "sort_order": 4, "description": "Ergonomic treatment centers and operator seating."},
            {"name": "3D Oral Scanners", "parent": None, "sort_order": 5, "description": "3D intraoral digital scanners and imaging solutions."},
            {"name": "Dental Air Compressors", "parent": None, "sort_order": 6, "description": "Oil-free medical grade dental air compressors."},
            {"name": "Advanced Dental Equipment & Accessories", "parent": None, "sort_order": 7, "description": "Ultrasonic scalers, apex locators, and surgical accessories."},
            
            # Sub-categories
            {"name": "High-Speed Handpieces", "parent": "Dental Handpieces", "sort_order": 1, "description": "High rpm air turbines and fiberoptic drills."},
            {"name": "Low-Speed Handpieces", "parent": "Dental Handpieces", "sort_order": 2, "description": "Contra-angles, straight handpieces, and air motors."},
            {"name": "Cordless Curing Units", "parent": "LED Light Cure Units", "sort_order": 1, "description": "High intensity cordless light curing systems."},
            {"name": "Patient Chair Suites", "parent": "Dental Chairs", "sort_order": 1, "description": "Smart clinical patient treatment chairs."},
            {"name": "Ultrasonic Scalers", "parent": "Advanced Dental Equipment & Accessories", "sort_order": 1, "description": "Periodontal scaling and root planning scaling units."},

            # Sub-sub-categories
            {"name": "Air Turbines", "parent": "High-Speed Handpieces", "sort_order": 1, "description": "Friction grip air turbine handpieces."},
            {"name": "Contra-Angles", "parent": "Low-Speed Handpieces", "sort_order": 1, "description": "Multiplying or reducing contra-angle attachments."}
        ]

        created_cats = {}
        for c_data in categories_data:
            parent_node = None
            if c_data["parent"]:
                parent_node = created_cats[c_data["parent"]]
            
            cat, created = Category.objects.get_or_create(
                name=c_data["name"],
                parent=parent_node,
                defaults={
                    "sort_order": c_data["sort_order"],
                    "description": c_data["description"],
                    "is_active": True
                }
            )
            created_cats[cat.name] = cat
            if created:
                self.stdout.write(f"Seeded Category: {cat.full_path}")

        # 4. Seed Products
        products_data = [
            {
                "name": "NSK Pana-Max 2 M4 High Speed Turbine",
                "sku": "NSK-PM2-M4",
                "brand": "NSK",
                "category": "Air Turbines",
                "short_description": "Standard high speed clinical dental turbine with clean head system and Borden 4-hole connection.",
                "long_description": "Pana-Max2 offers much higher durability and power than previous models, while being just as easy to handle. The sleek stainless steel body is scratch-resistant and autoclavable up to 135 degrees. Features NSK's patented Clean Head System to prevent cross-contamination.",
                "tags": ["drill", "high-speed", "turbine", "nsk"],
                "status": ProductStatus.ACTIVE,
                "is_featured": True,
                "weight_kg": 0.054,
                "warranty_months_override": None,
                "specs": [
                    {"name": "Speed", "value": "400,000", "unit": "rpm", "sort_order": 1},
                    {"name": "Head Size", "value": "11.2 x H13.4", "unit": "mm", "sort_order": 2},
                    {"name": "Spray", "value": "Single Water Jet", "unit": "", "sort_order": 3},
                    {"name": "Connection", "value": "Borden 4-Hole", "unit": "", "sort_order": 4}
                ],
                "documents": [
                    {"title": "Pana-Max 2 Instructions for Use", "type": ProductDocumentType.IFU, "url": "https://faazo-assets.s3.amazonaws.com/manuals/sample.pdf"}
                ]
            },
            {
                "name": "Woodpecker LED.H Orthodontic Curing Light",
                "sku": "WP-LEDH-ORTHO",
                "brand": "Woodpecker",
                "category": "Cordless Curing Units",
                "short_description": "High intensity cordless curing light with dedicated orthodontic fast polymerizing mode.",
                "long_description": "Ergonomic gun-style cordless light curing unit. Designed with dual intensity modes: standard (1000 mW/cm2) and high/ortho (1800 mW/cm2) for rapid 3-second brackets bonding. High capacity lithium battery cures up to 400 cycles per single charge.",
                "tags": ["curing", "orthodontic", "curing-light", "woodpecker"],
                "status": ProductStatus.ACTIVE,
                "is_featured": True,
                "weight_kg": 0.320,
                "warranty_months_override": 18,  # Woodpecker override
                "specs": [
                    {"name": "Wavelength Range", "value": "420 - 480", "unit": "nm", "sort_order": 1},
                    {"name": "Light Output Intensity", "value": "1000 - 1800", "unit": "mW/cm2", "sort_order": 2},
                    {"name": "Battery Capacity", "value": "2000", "unit": "mAh", "sort_order": 3}
                ],
                "documents": [
                    {"title": "Woodpecker LED.H Operations Brochure", "type": ProductDocumentType.BROCHURE, "url": "https://faazo-assets.s3.amazonaws.com/manuals/sample.pdf"}
                ]
            },
            {
                "name": "W&H Synea Vision WK-93 LT Contra Angle",
                "sku": "WH-SYNEA-WK93",
                "brand": "W&H",
                "category": "Contra-Angles",
                "short_description": "Premium 1:5 multiplying contra-angle with penta spray, glass rod fiberoptic, and ceramic ball bearings.",
                "long_description": "Synea Vision represents the pinnacle of W&H handpiece engineering. Features scratch-resistant stainless steel body with unique block-coating, penta-spray (5-hole water/air cooling) for perfect visualization and safety, and high-performance ceramic bearings for noise reduction.",
                "tags": ["contra-angle", "fiberoptic", "premium", "wh"],
                "status": ProductStatus.ACTIVE,
                "is_featured": False,
                "weight_kg": 0.082,
                "warranty_months_override": None,
                "specs": [
                    {"name": "Transmission Ratio", "value": "1:5 (Multiplying)", "unit": "", "sort_order": 1},
                    {"name": "Maximum Speed", "value": "200,000", "unit": "rpm", "sort_order": 2},
                    {"name": "Cooling Spray", "value": "Penta Spray (5 Jets)", "unit": "", "sort_order": 3},
                    {"name": "Light Guide", "value": "Glass Rod Compact Optical", "unit": "", "sort_order": 4}
                ],
                "documents": [
                    {"title": "W&H Synea Vision Series User Manual", "type": ProductDocumentType.MANUAL, "url": "https://faazo-assets.s3.amazonaws.com/manuals/sample.pdf"}
                ]
            }
        ]

        for p_data in products_data:
            brand_obj = created_brands[p_data["brand"]]
            cat_obj = created_cats[p_data["category"]]
            
            prod, created = Product.objects.get_or_create(
                sku=p_data["sku"],
                defaults={
                    "name": p_data["name"],
                    "brand": brand_obj,
                    "category": cat_obj,
                    "short_description": p_data["short_description"],
                    "long_description": p_data["long_description"],
                    "tags": p_data["tags"],
                    "status": p_data["status"],
                    "is_featured": p_data["is_featured"],
                    "weight_kg": p_data["weight_kg"],
                    "warranty_months_override": p_data["warranty_months_override"],
                    "created_by": user,
                    "updated_by": user
                }
            )
            
            if created:
                # Add attributes (specs)
                for spec in p_data["specs"]:
                    ProductAttribute.objects.create(
                        product=prod,
                        name=spec["name"],
                        value=spec["value"],
                        unit=spec["unit"],
                        sort_order=spec["sort_order"]
                    )
                
                # Add documents
                for doc in p_data["documents"]:
                    ProductDocument.objects.create(
                        product=prod,
                        title=doc["title"],
                        document_type=doc["type"],
                        external_url=doc["url"],
                        is_public=True,
                        created_by=user,
                        updated_by=user
                    )
                
                self.stdout.write(f"Seeded Product: {prod.name}")

        self.stdout.write(self.style.SUCCESS("Catalogue database seeding successfully completed!"))
