"""
FAAZO – Users App Configuration
"""

from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"
    verbose_name = "Users"

    def ready(self):
        """Import signals so they are registered when Django starts."""
        import apps.users.signals  # noqa: F401
