from django.contrib import admin
from .models import (
    UserProfile, VehicleCategory, Vehicle, 
    Booking, Review, Payment, OwnerEarning
)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'user_type', 'phone_number', 'city']
    list_filter = ['user_type', 'city']
    search_fields = ['user__username', 'user__email', 'phone_number']

@admin.register(VehicleCategory)
class VehicleCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['brand', 'model', 'year', 'owner', 'price_per_day', 'status', 'average_rating']
    list_filter = ['status', 'fuel_type', 'transmission', 'city']
    search_fields = ['brand', 'model', 'registration_number']
    readonly_fields = ['average_rating', 'total_reviews', 'created_at', 'updated_at']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'vehicle', 'start_date', 'end_date', 'booking_status', 'payment_status']
    list_filter = ['booking_status', 'payment_status']
    search_fields = ['customer__username', 'vehicle__brand', 'vehicle__model']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['customer', 'vehicle', 'rating', 'created_at']
    list_filter = ['rating']
    search_fields = ['customer__username', 'vehicle__brand', 'comment']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'customer', 'amount', 'payment_method', 'payment_date']
    list_filter = ['payment_method', 'status']
    search_fields = ['transaction_id', 'customer__username']

@admin.register(OwnerEarning)
class OwnerEarningAdmin(admin.ModelAdmin):
    list_display = ['owner', 'booking', 'amount', 'commission', 'net_amount', 'is_paid']
    list_filter = ['is_paid']
    search_fields = ['owner__username']