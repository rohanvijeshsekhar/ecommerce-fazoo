"""
FAAZO – Pricing Serializers (Phase 6A)
"""

from decimal import Decimal
from rest_framework import serializers
from .models import ProductPricing


class ProductPricingSerializer(serializers.ModelSerializer):
    """
    Full pricing serializer for admin read/write.
    Computed fields (is_offer_active, effective_price, etc.) are read-only.
    """

    is_offer_active      = serializers.BooleanField(read_only=True)
    effective_price      = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    discount_percentage  = serializers.FloatField(read_only=True, allow_null=True)
    you_save             = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, allow_null=True)

    class Meta:
        model = ProductPricing
        fields = [
            "id",
            "mrp",
            "selling_price",
            "offer_price",
            "dealer_price",
            "gst_percentage",
            "offer_start_date",
            "offer_end_date",
            # Computed
            "is_offer_active",
            "effective_price",
            "discount_percentage",
            "you_save",
            # Timestamps
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_offer_active", "effective_price", "discount_percentage", "you_save", "created_at", "updated_at"]

    # ── Validation ────────────────────────────────────────────────────────────

    def validate(self, data):
        mrp           = data.get("mrp", getattr(self.instance, "mrp", Decimal("0")))
        selling_price = data.get("selling_price", getattr(self.instance, "selling_price", Decimal("0")))
        offer_price   = data.get("offer_price", getattr(self.instance, "offer_price", None))
        dealer_price  = data.get("dealer_price", getattr(self.instance, "dealer_price", None))
        offer_start   = data.get("offer_start_date", getattr(self.instance, "offer_start_date", None))
        offer_end     = data.get("offer_end_date", getattr(self.instance, "offer_end_date", None))

        if mrp < Decimal("0"):
            raise serializers.ValidationError({"mrp": "MRP cannot be negative."})
        if selling_price < Decimal("0"):
            raise serializers.ValidationError({"selling_price": "Selling price cannot be negative."})
        if selling_price > mrp and mrp > Decimal("0"):
            raise serializers.ValidationError({"selling_price": "Selling price cannot exceed MRP."})
        if offer_price is not None:
            if offer_price < Decimal("0"):
                raise serializers.ValidationError({"offer_price": "Offer price cannot be negative."})
            if offer_price > selling_price:
                raise serializers.ValidationError({"offer_price": "Offer price cannot exceed selling price."})
        if dealer_price is not None:
            if dealer_price < Decimal("0"):
                raise serializers.ValidationError({"dealer_price": "Dealer price cannot be negative."})
            if dealer_price > selling_price:
                raise serializers.ValidationError({"dealer_price": "Dealer price cannot exceed selling price."})
        if offer_start and offer_end and offer_start > offer_end:
            raise serializers.ValidationError({"offer_end_date": "Offer end date must be on or after the start date."})
        return data


class ProductPricingPublicSerializer(serializers.ModelSerializer):
    """
    Customer-safe serializer. Strips dealer_price and gst_percentage.
    Computed fields only — no write.
    """

    is_offer_active     = serializers.BooleanField(read_only=True)
    effective_price     = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    discount_percentage = serializers.FloatField(read_only=True, allow_null=True)
    you_save            = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, allow_null=True)

    class Meta:
        model = ProductPricing
        fields = [
            "mrp",
            "selling_price",
            "offer_price",
            "offer_start_date",
            "offer_end_date",
            "is_offer_active",
            "effective_price",
            "discount_percentage",
            "you_save",
        ]
        read_only_fields = fields


class ProductPricingDealerSerializer(ProductPricingPublicSerializer):
    """
    Extends public serializer with dealer_price for verified dealers.
    """

    class Meta(ProductPricingPublicSerializer.Meta):
        fields = ProductPricingPublicSerializer.Meta.fields + ["dealer_price"]
        read_only_fields = fields


class ProductPricingInlineSerializer(serializers.ModelSerializer):
    """
    Inline pricing serializer embedded in ProductListSerializer.
    Returns complete pricing details required for admin tables and product card rendering.
    """

    is_offer_active     = serializers.BooleanField(read_only=True)
    effective_price     = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    discount_percentage = serializers.FloatField(read_only=True, allow_null=True)

    class Meta:
        model = ProductPricing
        fields = [
            "mrp",
            "selling_price",
            "offer_price",
            "dealer_price",
            "gst_percentage",
            "offer_start_date",
            "offer_end_date",
            "is_offer_active",
            "effective_price",
            "discount_percentage",
        ]
        read_only_fields = fields
