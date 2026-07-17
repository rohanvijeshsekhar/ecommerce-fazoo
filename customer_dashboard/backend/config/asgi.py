"""
FAAZO Backend – ASGI Configuration
Used for future WebSocket / async support.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

application = get_asgi_application()
