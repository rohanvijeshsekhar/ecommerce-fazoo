"""
FAAZO – Dealer Serializers

DealerRegisterSerializer  — Handled in apps.authentication (dealer/register/)
DealerStatusSerializer    — Read-only status view for the dealer portal
DealerApplicationAdminSerializer — Full admin view with user info, nested profile
"""

from rest_framework import serializers

from apps.dealer.models import DealerApplication


class DealerStatusSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for a dealer's own application status.

    Exposes only the information the dealer needs to see in their portal:
    - Company name
    - Current status (pending / approved / rejected)
    - can_purchase — backend-authoritative flag
    - Rejection reason (if applicable)
    - Application submission date
    - Review date (if reviewed)
    """

    status_display = serializers.CharField(source="get_status_display", read_only=True)
    can_purchase = serializers.SerializerMethodField()

    class Meta:
        model = DealerApplication
        fields = [
            "id",
            "company_name",
            "status",
            "status_display",
            "can_purchase",
            "rejection_reason",
            "created_at",
            "reviewed_at",
        ]
        read_only_fields = fields

    def get_can_purchase(self, obj) -> bool:
        from apps.dealer.models import DealerStatus
        return obj.status == DealerStatus.APPROVED


class DealerApplicationAdminSerializer(serializers.ModelSerializer):
    """
    Admin-facing serializer — full detail with applicant profile information.
    All fields are read-only; admins cannot edit dealer personal data.
    Only admin_notes can be updated via PATCH.
    """

    # Review metadata
    reviewed_by_email = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    # Applicant identity (from User model)
    applicant_id = serializers.UUIDField(source="user.id", read_only=True)
    applicant_name = serializers.CharField(source="user.full_name", read_only=True)
    applicant_email = serializers.EmailField(source="user.email", read_only=True)
    applicant_phone = serializers.CharField(source="user.phone_number", read_only=True)
    applicant_role = serializers.CharField(source="user.role", read_only=True)
    date_joined = serializers.DateTimeField(source="user.date_joined", read_only=True)
    last_login = serializers.DateTimeField(source="user.last_login", read_only=True)

    # Profile data (clinic / GST details — from UserProfile)
    profession = serializers.SerializerMethodField()
    clinic_name = serializers.SerializerMethodField()
    gst_number = serializers.SerializerMethodField()
    clinic_phone = serializers.SerializerMethodField()
    clinic_email = serializers.SerializerMethodField()

    # Primary address city/state
    city = serializers.SerializerMethodField()
    state = serializers.SerializerMethodField()
    address_line1 = serializers.SerializerMethodField()
    address_pincode = serializers.SerializerMethodField()

    # Document URL (safe access)
    document_url = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()

    class Meta:
        model = DealerApplication
        fields = [
            "id",
            # Application info
            "company_name",
            "status",
            "status_display",
            "rejection_reason",
            "admin_notes",
            "created_at",
            "updated_at",
            "reviewed_at",
            "reviewed_by_email",
            "reviewed_by_name",
            # Applicant identity
            "applicant_id",
            "applicant_name",
            "applicant_email",
            "applicant_phone",
            "applicant_role",
            "date_joined",
            "last_login",
            # Profile
            "profession",
            "clinic_name",
            "gst_number",
            "clinic_phone",
            "clinic_email",
            # Address
            "city",
            "state",
            "address_line1",
            "address_pincode",
            # Document
            "document_url",
            "documents",
        ]

    def get_reviewed_by_email(self, obj) -> str | None:
        return obj.reviewed_by.email if obj.reviewed_by else None

    def get_reviewed_by_name(self, obj) -> str | None:
        return obj.reviewed_by.full_name if obj.reviewed_by else None

    def get_profession(self, obj) -> str:
        profile = getattr(obj.user, "profile", None)
        return getattr(profile, "profession", "") or ""

    def get_clinic_name(self, obj) -> str:
        profile = getattr(obj.user, "profile", None)
        return getattr(profile, "clinic_name", "") or ""

    def get_gst_number(self, obj) -> str:
        profile = getattr(obj.user, "profile", None)
        return getattr(profile, "gst_number", "") or ""

    def get_clinic_phone(self, obj) -> str:
        profile = getattr(obj.user, "profile", None)
        return getattr(profile, "clinic_phone", "") or ""

    def get_clinic_email(self, obj) -> str:
        profile = getattr(obj.user, "profile", None)
        return getattr(profile, "clinic_email", "") or ""

    def _get_primary_address(self, obj):
        """Return the default address or the first address of the applicant."""
        addresses = obj.user.addresses.all()
        default = addresses.filter(is_default=True).first()
        return default or addresses.first()

    def get_city(self, obj) -> str:
        addr = self._get_primary_address(obj)
        return addr.city if addr else ""

    def get_state(self, obj) -> str:
        addr = self._get_primary_address(obj)
        return addr.state if addr else ""

    def get_address_line1(self, obj) -> str:
        addr = self._get_primary_address(obj)
        return addr.line1 if addr else ""

    def get_address_pincode(self, obj) -> str:
        addr = self._get_primary_address(obj)
        return addr.pincode if addr else ""

    def get_document_url(self, obj) -> str | None:
        request = self.context.get("request")
        if obj.document and request:
            return request.build_absolute_uri(obj.document.url)
        if obj.document:
            try:
                return obj.document.url
            except Exception:
                return None
        return None

    def get_documents(self, obj) -> list:
        request = self.context.get("request")
        result = []
        for doc in obj.documents.all():
            url = None
            if doc.document:
                if request:
                    url = request.build_absolute_uri(doc.document.url)
                else:
                    try:
                        url = doc.document.url
                    except Exception:
                        url = None
            result.append({
                "id": str(doc.id),
                "name": doc.document.name.split("/")[-1] if doc.document else "document",
                "document_url": url,
            })
        return result
