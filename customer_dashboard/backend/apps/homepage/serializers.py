"""
FAAZO – Homepage CMS Serializers

Two serializer layers per section:
  - *ReadSerializer  → public storefront GET (AllowAny) – compact, fast
  - *WriteSerializer → admin CRUD (IsAdmin) – full field control
"""

from rest_framework import serializers
from apps.pricing.serializers import ProductPricingInlineSerializer
from apps.inventory.serializers import ProductInventoryInlineSerializer


from .models import (
    HeroSlide,
    HomepageCategory,
    HomepageBrand,
    BestSeller,
    FeaturedCollection,
    FeaturedCollectionItem,
    LimitedTimeOffer,
    ExploreSolution,
    Testimonial,
    RecommendedProduct,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def abs_image_url(request, field):
    """Return absolute URL for an ImageField value, or None."""
    if field and hasattr(field, 'url'):
        return request.build_absolute_uri(field.url) if request else field.url
    return None


# ============================================================
# 1. Hero Slides
# ============================================================

class HeroSlideReadSerializer(serializers.ModelSerializer):
    desktop_image_url = serializers.SerializerMethodField()
    mobile_image_url  = serializers.SerializerMethodField()

    class Meta:
        model  = HeroSlide
        fields = [
            "id", "heading", "subheading",
            "cta_text", "cta_link",
            "desktop_image_url", "mobile_image_url",
            "sort_order", "is_active",
        ]

    def get_desktop_image_url(self, obj):
        return abs_image_url(self.context.get("request"), obj.desktop_image)

    def get_mobile_image_url(self, obj):
        return abs_image_url(self.context.get("request"), obj.mobile_image)


class HeroSlideWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = HeroSlide
        fields = [
            "id", "heading", "subheading",
            "cta_text", "cta_link",
            "desktop_image", "mobile_image",
            "sort_order", "is_active",
        ]
        read_only_fields = ["id"]


# ============================================================
# 2. Homepage Categories
# ============================================================

class HomepageCategoryReadSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    display_title = serializers.CharField(read_only=True)
    card_image_url = serializers.SerializerMethodField()

    class Meta:
        model  = HomepageCategory
        fields = [
            "id", "category", "category_name", "category_slug",
            "display_title", "card_image_url", "icon_key",
            "sort_order", "is_visible",
        ]

    def get_card_image_url(self, obj):
        request = self.context.get("request")
        # Prefer override → category image
        if obj.card_image:
            return abs_image_url(request, obj.card_image)
        if obj.category.image:
            return abs_image_url(request, obj.category.image)
        return None


class HomepageCategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = HomepageCategory
        fields = [
            "id", "category", "card_image", "title_override",
            "icon_key", "sort_order", "is_visible",
        ]
        read_only_fields = ["id"]


# ============================================================
# 3. Homepage Brands
# ============================================================

class HomepageBrandReadSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    brand_slug = serializers.CharField(source="brand.slug", read_only=True)
    logo_url   = serializers.SerializerMethodField()

    class Meta:
        model  = HomepageBrand
        fields = [
            "id", "brand", "brand_name", "brand_slug",
            "logo_url", "sort_order", "is_visible",
        ]

    def get_logo_url(self, obj):
        request = self.context.get("request")
        if obj.logo_override:
            return abs_image_url(request, obj.logo_override)
        if obj.brand.logo:
            return abs_image_url(request, obj.brand.logo)
        return None


class HomepageBrandWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = HomepageBrand
        fields = ["id", "brand", "logo_override", "sort_order", "is_visible"]
        read_only_fields = ["id"]


# ============================================================
# 4. Best Sellers
# ============================================================

class BestSellerReadSerializer(serializers.ModelSerializer):
    product_slug     = serializers.CharField(source="product.slug", read_only=True)
    product_name     = serializers.CharField(source="product.name", read_only=True)
    display_heading  = serializers.SerializerMethodField()
    display_image_url = serializers.SerializerMethodField()
    display_short_description = serializers.SerializerMethodField()
    pricing          = ProductPricingInlineSerializer(source="product.pricing", read_only=True, allow_null=True)
    inventory        = ProductInventoryInlineSerializer(source="product.inventory", read_only=True, allow_null=True)

    class Meta:
        model  = BestSeller
        fields = [
            "id", "product", "product_slug", "product_name",
            "display_heading", "display_short_description",
            "display_image_url", "sort_order", "is_visible",
            "pricing", "inventory",
        ]

    def get_display_heading(self, obj):
        return obj.custom_heading or obj.product.name

    def get_display_short_description(self, obj):
        return obj.short_description or obj.product.short_description

    def get_display_image_url(self, obj):
        request = self.context.get("request")
        if obj.display_image:
            return abs_image_url(request, obj.display_image)
        primary = obj.product.primary_image
        if primary and primary.image:
            return abs_image_url(request, primary.image)
        return None


class BestSellerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BestSeller
        fields = [
            "id", "product", "display_image",
            "custom_heading", "short_description",
            "sort_order", "is_visible",
        ]
        read_only_fields = ["id"]


# ============================================================
# 5 & 6. Featured Collections
# ============================================================

class FeaturedCollectionItemReadSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_image = serializers.SerializerMethodField()
    pricing          = ProductPricingInlineSerializer(source="product.pricing", read_only=True, allow_null=True)
    inventory        = ProductInventoryInlineSerializer(source="product.inventory", read_only=True, allow_null=True)

    class Meta:
        model  = FeaturedCollectionItem
        fields = ["id", "product", "product_name", "product_slug", "product_image", "sort_order", "pricing", "inventory"]

    def get_product_image(self, obj):
        request = self.context.get("request")
        primary = obj.product.primary_image
        if primary and primary.image:
            return abs_image_url(request, primary.image)
        return None


class FeaturedCollectionReadSerializer(serializers.ModelSerializer):
    items = FeaturedCollectionItemReadSerializer(many=True, read_only=True)

    class Meta:
        model  = FeaturedCollection
        fields = ["id", "title", "description", "sort_order", "is_visible", "items"]


class FeaturedCollectionItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FeaturedCollectionItem
        fields = ["id", "collection", "product", "sort_order"]
        read_only_fields = ["id"]


class FeaturedCollectionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FeaturedCollection
        fields = ["id", "title", "description", "sort_order", "is_visible"]
        read_only_fields = ["id"]


# ============================================================
# 7. Limited Time Offers
# ============================================================

class LimitedTimeOfferReadSerializer(serializers.ModelSerializer):
    banner_image_url = serializers.SerializerMethodField()

    class Meta:
        model  = LimitedTimeOffer
        fields = [
            "id", "banner_image_url", "heading", "description",
            "offer_text", "start_date", "end_date",
            "cta_text", "cta_link", "sort_order", "is_active",
        ]

    def get_banner_image_url(self, obj):
        return abs_image_url(self.context.get("request"), obj.banner_image)


class LimitedTimeOfferWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LimitedTimeOffer
        fields = [
            "id", "banner_image", "heading", "description",
            "offer_text", "start_date", "end_date",
            "cta_text", "cta_link", "sort_order", "is_active",
        ]
        read_only_fields = ["id"]


# ============================================================
# 8. Explore Solutions
# ============================================================

class ExploreSolutionReadSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    display_heading = serializers.CharField(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = ExploreSolution
        fields = [
            "id", "category", "category_name", "category_slug",
            "display_heading", "image_url", "sort_order", "is_visible",
        ]

    def get_image_url(self, obj):
        return abs_image_url(self.context.get("request"), obj.image)


class ExploreSolutionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ExploreSolution
        fields = ["id", "category", "image", "heading", "sort_order", "is_visible"]
        read_only_fields = ["id"]


# ============================================================
# 9. Testimonials
# ============================================================

class TestimonialReadSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model  = Testimonial
        fields = [
            "id", "customer_name", "clinic_name",
            "photo_url", "rating", "review",
            "sort_order", "is_active",
        ]

    def get_photo_url(self, obj):
        request = self.context.get("request")
        if obj.photo:
            return abs_image_url(request, obj.photo)
        return obj.photo_url or None


class TestimonialWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Testimonial
        fields = [
            "id", "customer_name", "clinic_name",
            "photo", "photo_url", "rating", "review",
            "sort_order", "is_active",
        ]
        read_only_fields = ["id"]


# ============================================================
# 10. Recommended Products
# ============================================================

class RecommendedProductReadSerializer(serializers.ModelSerializer):
    product_name  = serializers.CharField(source="product.name", read_only=True)
    product_slug  = serializers.CharField(source="product.slug", read_only=True)
    product_sku   = serializers.CharField(source="product.sku", read_only=True)
    primary_image = serializers.SerializerMethodField()
    brand_name    = serializers.CharField(source="product.brand.name", read_only=True)
    short_description = serializers.CharField(source="product.short_description", read_only=True)
    is_featured   = serializers.BooleanField(source="product.is_featured", read_only=True)
    pricing          = ProductPricingInlineSerializer(source="product.pricing", read_only=True, allow_null=True)
    inventory        = ProductInventoryInlineSerializer(source="product.inventory", read_only=True, allow_null=True)

    class Meta:
        model  = RecommendedProduct
        fields = [
            "id", "product", "product_name", "product_slug", "product_sku",
            "brand_name", "short_description", "is_featured",
            "primary_image", "sort_order", "is_visible",
            "pricing", "inventory",
        ]

    def get_primary_image(self, obj):
        request = self.context.get("request")
        primary = obj.product.primary_image
        if primary and primary.image:
            return abs_image_url(request, primary.image)
        return None


class RecommendedProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RecommendedProduct
        fields = ["id", "product", "sort_order", "is_visible"]
        read_only_fields = ["id"]


# ============================================================
# Reorder Serializer (shared)
# ============================================================

class ReorderSerializer(serializers.Serializer):
    """Used by all reorder endpoints: PATCH /reorder/ with [{id, sort_order}]"""
    id         = serializers.UUIDField()
    sort_order = serializers.IntegerField(min_value=0)
