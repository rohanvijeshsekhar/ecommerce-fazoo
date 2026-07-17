from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.products.models import Product
from apps.orders.models import Order
from apps.warranty.models import (
    WarrantyRegistration,
    WarrantyClaim,
    WarrantyAttachment,
    ClaimTimeline,
    WarrantyProvider,
    WarrantyRegistrationStatus,
    ClaimPriority,
    ClaimStatus,
    AttachmentType
)

User = get_user_model()

# ============================================================
# Nested Serializers
# ============================================================

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role"]


class OrderMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["id", "order_number", "invoice_number", "status", "created_at"]


class WarrantyProductSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    primary_image_url = serializers.SerializerMethodField()
    warranty_months_effective = serializers.IntegerField(source="effective_warranty_months", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "brand_name",
            "primary_image_url", "warranty_months", "warranty_months_effective",
            "warranty_provider", "warranty_terms", "warranty_contact_details",
            "serial_number_required", "warranty_website_url"
        ]

    def get_primary_image_url(self, obj):
        img = obj.primary_image
        if img and img.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url
        return None


class WarrantyAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = WarrantyAttachment
        fields = ["id", "file", "attachment_type", "created_at"]
        read_only_fields = ["id", "created_at"]


class ClaimTimelineSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source="performed_by.full_name", read_only=True)
    performed_by_role = serializers.CharField(source="performed_by.role", read_only=True)

    class Meta:
        model = ClaimTimeline
        fields = [
            "id", "action", "performed_by", "performed_by_name",
            "performed_by_role", "notes", "created_at"
        ]
        read_only_fields = ["id", "created_at"]


# ============================================================
# Main Serializers
# ============================================================

class WarrantyRegistrationSerializer(serializers.ModelSerializer):
    product = WarrantyProductSerializer(read_only=True)
    order = OrderMinimalSerializer(read_only=True)
    user = UserMinimalSerializer(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    invoice_url = serializers.SerializerMethodField()

    class Meta:
        model = WarrantyRegistration
        fields = [
            "id", "user", "order", "order_item", "product", "serial_number",
            "purchase_date", "warranty_start", "warranty_end",
            "warranty_provider", "warranty_status", "days_remaining",
            "invoice", "invoice_url", "notes", "admin_notes", "created_at"
        ]
        read_only_fields = [
            "id", "user", "order", "order_item", "product", "purchase_date",
            "warranty_start", "warranty_end", "warranty_provider",
            "warranty_status", "days_remaining", "invoice", "invoice_url",
            "notes", "admin_notes", "created_at"
        ]

    def get_invoice_url(self, obj):
        if obj.invoice:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.invoice.url)
            return obj.invoice.url
        return None


class WarrantyClaimSerializer(serializers.ModelSerializer):
    registration_detail = WarrantyRegistrationSerializer(source="registration", read_only=True)
    attachments = WarrantyAttachmentSerializer(many=True, read_only=True)
    timeline = ClaimTimelineSerializer(many=True, read_only=True)

    class Meta:
        model = WarrantyClaim
        fields = [
            "id", "claim_number", "registration", "registration_detail",
            "description", "priority", "status", "assigned_provider",
            "admin_notes", "resolution", "attachments", "timeline",
            "created_at", "updated_at"
        ]
        read_only_fields = [
            "id", "claim_number", "status", "assigned_provider",
            "admin_notes", "resolution", "attachments", "timeline",
            "created_at", "updated_at"
        ]

    def validate_registration(self, value):
        from django.utils import timezone
        request = self.context.get("request")
        if not request or not request.user:
            return value

        # Customer/Dealer security validation: can only claim for own registrations
        role = getattr(request.user, "role", None)
        role_name = getattr(role, "name", None) or str(role)
        is_admin = getattr(request.user, "is_superuser", False) or role_name.lower() == "admin"
        if not is_admin and value.user != request.user:
            raise serializers.ValidationError("You do not own this warranty registration.")

        # GATING: Expiry check
        today = timezone.now().date()
        if value.warranty_status == WarrantyRegistrationStatus.EXPIRED or today > value.warranty_end:
            raise serializers.ValidationError("Warranty has expired.")

        # GATING: Warranty must be active to raise claims
        if value.warranty_status != WarrantyRegistrationStatus.ACTIVE:
            raise serializers.ValidationError("Warranty must be approved before raising a claim.")

        # Prevent multiple active warranty claims for the same registration.
        has_active_claim = WarrantyClaim.objects.filter(
            registration=value
        ).exclude(
            status__in=[ClaimStatus.CLOSED, ClaimStatus.REJECTED]
        ).exists()

        if has_active_claim:
            raise serializers.ValidationError("An active warranty claim already exists.")

        return value
