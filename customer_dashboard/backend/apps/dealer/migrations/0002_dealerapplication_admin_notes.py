from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dealer', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='dealerapplication',
            name='admin_notes',
            field=models.TextField(
                blank=True,
                default='',
                help_text='Internal notes added by admin during review. Not visible to the dealer.',
                verbose_name='Admin Notes',
            ),
        ),
    ]
