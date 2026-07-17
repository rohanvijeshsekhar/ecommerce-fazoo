from django.contrib import admin
from .models import ComboDeal, ComboDealProduct, ComboDealImage, ComboDealBannerSetting


class ComboDealProductInline(admin.TabularInline):
    model = ComboDealProduct
    extra = 1


class ComboDealImageInline(admin.TabularInline):
    model = ComboDealImage
    extra = 1


@admin.register(ComboDeal)
class ComboDealAdmin(admin.ModelAdmin):
    list_display = ["title", "combo_price", "inventory", "status", "is_featured", "created_at"]
    list_filter = ["status", "is_featured", "created_at"]
    search_fields = ["title", "short_description"]
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ComboDealProductInline, ComboDealImageInline]


@admin.register(ComboDealBannerSetting)
class ComboDealBannerSettingAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "badge_text"]
