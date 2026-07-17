"""
FAAZO – Brand Serializers
"""

from rest_framework import serializers
from .models import Brand, BrandDocument


class BrandDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandDocument
        fields = [
            "id", "title", "document_type", "file",
            "external_url", "is_public", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class BrandListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views and dropdowns."""

    class Meta:
        model = Brand
        fields = [
            "id", "name", "slug", "logo", "country_of_origin",
            "warranty_months_default", "is_active",
        ]
        read_only_fields = ["id", "slug"]


class BrandDetailSerializer(serializers.ModelSerializer):
    """Full serializer including after-sales policy and documents."""

    documents = BrandDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Brand
        fields = [
            "id", "name", "slug", "description", "logo",
            "country_of_origin",
            # Contact
            "website_url", "support_email", "support_phone",
            # Warranty
            "warranty_policy_text", "warranty_months_default", "is_warranty_transferable",
            # Service
            "service_policy_text", "service_turnaround_days",
            # Compliance
            "certifications", "documentation_url",
            # Admin
            "is_active",
            # Documents
            "documents",
            # Timestamps
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at", "documents"]


class BrandWriteSerializer(serializers.ModelSerializer):
    """Serializer for create / update operations."""

    class Meta:
        model = Brand
        fields = [
            "id", "slug",
            "name", "description", "logo", "country_of_origin",
            "website_url", "support_email", "support_phone",
            "warranty_policy_text", "warranty_months_default", "is_warranty_transferable",
            "service_policy_text", "service_turnaround_days",
            "certifications", "documentation_url", "is_active",
        ]
        read_only_fields = ["id", "slug"]

    def validate_name(self, value):
        qs = Brand.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A brand with this name already exists.")
        return value


class BrandAfterSalesSerializer(serializers.ModelSerializer):
    """
    Minimal after-sales policy block embedded in Product detail responses.
    Never exposes internal admin fields.
    """

    class Meta:
        model = Brand
        fields = [
            "id", "name", "slug", "logo",
            "warranty_policy_text", "warranty_months_default", "is_warranty_transferable",
            "service_policy_text", "service_turnaround_days",
            "support_email", "support_phone", "documentation_url",
        ]
