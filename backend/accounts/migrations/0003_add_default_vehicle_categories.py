# Generated migration to add default vehicle categories

from django.db import migrations


def add_default_categories(apps, schema_editor):
    VehicleCategory = apps.get_model('accounts', 'VehicleCategory')
    defaults = [
        ('Car', 'Cars and sedans for rent'),
        ('Bike', 'Motorcycles and bikes for rent'),
        ('Truck', 'Trucks and commercial vehicles for rent'),
    ]
    for name, description in defaults:
        VehicleCategory.objects.get_or_create(name=name, defaults={'description': description})


def remove_default_categories(apps, schema_editor):
    VehicleCategory = apps.get_model('accounts', 'VehicleCategory')
    names = ['Car', 'Bike', 'Truck']
    VehicleCategory.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_alter_userprofile_address_and_more'),
    ]

    operations = [
        migrations.RunPython(add_default_categories, remove_default_categories),
    ]
