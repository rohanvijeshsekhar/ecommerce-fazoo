"""
FAAZO – Base Serializer Classes

All FAAZO serializers should inherit from one of these base classes
to enforce consistent field patterns, validation, and user injection.

Classes
-------
BaseModelSerializer
    Read-only id and timestamp fields. Base for most serializers.

AuditedSerializer
    Adds read-only created_by / updated_by display fields.

BaseWriteSerializer
    For create/update operations with automatic request user injection.

TimestampedSerializer
    Minimal read-only mixin for embedding timestamp info.
"""

from rest_framework import serializers

# ============================================================
# Field Mixins
# ============================================================


class TimestampedSerializer(serializers.Serializer):
    """
    Mixin that adds read-only timestamp fields to any serializer.
    Attach when you need created_at / updated_at in a non-model serializer.
    """

    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


# ============================================================
# Base Model Serializer
# ============================================================


class BaseModelSerializer(serializers.ModelSerializer):
    """
    Standard base for all FAAZO ModelSerializers.

    Provides:
    - Read-only `id` (UUID) field.
    - Read-only `created_at` / `updated_at` fields.
    - `get_request_user()` helper to safely access the current user.

    Usage:
        class ProductSerializer(BaseModelSerializer):
            class Meta(BaseModelSerializer.Meta):
                model = Product
                fields = BaseModelSerializer.Meta.fields + ['name', 'sku']
    """

    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        fields = ["id", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_request_user(self):
        """Safely retrieve the authenticated user from the request context."""
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            return request.user
        return None

    def validate(self, attrs):
        """
        Base validate hook. Call super() in child serializers.
        Subclasses can extend this for cross-field validation.
        """
        return super().validate(attrs)


# ============================================================
# Audited Serializer (includes created_by / updated_by)
# ============================================================


class AuditedSerializer(BaseModelSerializer):
    """
    Extends BaseModelSerializer with audit display fields.

    Adds:
    - created_by_display: string representation of created_by user.
    - updated_by_display: string representation of updated_by user.

    Usage:
        class PricingRuleSerializer(AuditedSerializer):
            class Meta(AuditedSerializer.Meta):
                model = PricingRule
                fields = AuditedSerializer.Meta.fields + ['price', 'role']
    """

    created_by_display = serializers.SerializerMethodField(read_only=True)
    updated_by_display = serializers.SerializerMethodField(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        fields = BaseModelSerializer.Meta.fields + [
            "created_by_display",
            "updated_by_display",
        ]

    def get_created_by_display(self, obj):
        if obj.created_by:
            return str(obj.created_by)
        return None

    def get_updated_by_display(self, obj):
        if obj.updated_by:
            return str(obj.updated_by)
        return None


# ============================================================
# Base Write Serializer (for create / update operations)
# ============================================================


class BaseWriteSerializer(BaseModelSerializer):
    """
    Base serializer for create and update operations.

    Automatically injects the authenticated request user into
    created_by / updated_by fields when the model supports them.

    Subclasses should NOT override create() or update() unless
    they have business logic specific to that model.

    Usage:
        class CreateOrderSerializer(BaseWriteSerializer):
            class Meta(BaseWriteSerializer.Meta):
                model = Order
                fields = BaseWriteSerializer.Meta.fields + ['product', 'quantity']
    """

    def _inject_user(self, validated_data: dict, is_update: bool = False) -> dict:
        """Inject request user into audit fields if the model has them."""
        user = self.get_request_user()
        if user is None:
            return validated_data

        if not is_update and hasattr(self.Meta.model, "created_by_id"):
            validated_data.setdefault("created_by", user)

        if hasattr(self.Meta.model, "updated_by_id"):
            validated_data["updated_by"] = user

        return validated_data

    def create(self, validated_data: dict):
        validated_data = self._inject_user(validated_data, is_update=False)
        return super().create(validated_data)

    def update(self, instance, validated_data: dict):
        validated_data = self._inject_user(validated_data, is_update=True)
        return super().update(instance, validated_data)
