"""
FAAZO – Dealer App Configuration
"""

from django.apps import AppConfig


class DealerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.dealer"
    verbose_name = "Dealer"
