"""
Migration: Remove non-commerce fields from UserProfile.

Dropped fields (FAAZO v1 cleanup):
    - bio
    - gender
    - date_of_birth
    - dental_license
    - dental_specialty
    - clinic_registration_number
    - clinic_address
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_phase4_profile_fields"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="userprofile",
            name="bio",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="gender",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="date_of_birth",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="dental_license",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="dental_specialty",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="clinic_registration_number",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="clinic_address",
        ),
    ]
