from django.urls import path, include
from .views import (
    request_password_reset,
    reset_password,
    get_user_profile, update_user_profile, RegisterView,
    VehicleListView, VehicleDetailView,
    OwnerVehicleListView, OwnerVehicleCreateView,
    OwnerVehicleUpdateView, OwnerVehicleDeleteView,
    VehicleCategoryListView,
    CreateBookingView, CustomerBookingListView,
    OwnerBookingListView, BookingDetailView,
    UpdateBookingStatusView,
    CreateReviewView, VehicleReviewsView, ReplyToReviewView,
    initiate_khalti_payment, verify_khalti_payment, PaymentHistoryView,
    get_dashboard_stats, OwnerEarningsListView, get_earning_summary
)

urlpatterns = [
    # Auth
    path('register/', RegisterView.as_view(), name='rest_register'),
    path('profile/', get_user_profile, name='user_profile'),
    path('profile/update/', update_user_profile, name='update_profile'),
    
    # Categories
    path('categories/', VehicleCategoryListView.as_view(), name='vehicle-categories'),
    
    # Public Vehicle endpoints
    path('vehicles/', VehicleListView.as_view(), name='vehicle-list'),
    path('vehicles/<int:pk>/', VehicleDetailView.as_view(), name='vehicle-detail'),
    path('vehicles/<int:vehicle_id>/reviews/', VehicleReviewsView.as_view(), name='vehicle-reviews'),
    
    # Owner Vehicle Management
    path('owner/vehicles/', OwnerVehicleListView.as_view(), name='owner-vehicles'),
    path('owner/vehicles/add/', OwnerVehicleCreateView.as_view(), name='add-vehicle'),
    path('owner/vehicles/<int:pk>/', OwnerVehicleUpdateView.as_view(), name='vehicle-detail-owner'),
    path('owner/vehicles/<int:pk>/update/', OwnerVehicleUpdateView.as_view(), name='update-vehicle'),
    path('owner/vehicles/<int:pk>/delete/', OwnerVehicleDeleteView.as_view(), name='delete-vehicle'),
    
    # Bookings
    path('bookings/create/', CreateBookingView.as_view(), name='create-booking'),
    path('customer/bookings/', CustomerBookingListView.as_view(), name='customer-bookings'),
    path('customer/bookings/<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('owner/bookings/', OwnerBookingListView.as_view(), name='owner-bookings'),
    path('owner/bookings/<int:pk>/', BookingDetailView.as_view(), name='owner-booking-detail'),
    path('owner/bookings/<int:pk>/update-status/', UpdateBookingStatusView.as_view(), name='update-booking-status'),
    
    # Reviews
    path('bookings/<int:booking_id>/review/', CreateReviewView.as_view(), name='create-review'),
    path('reviews/<int:pk>/reply/', ReplyToReviewView.as_view(), name='reply-review'),
    
    # Payments
    path('payments/khalti/initiate/', initiate_khalti_payment, name='khalti-initiate'),
    path('payments/khalti/verify/', verify_khalti_payment, name='khalti-verify'),
    path('payments/history/', PaymentHistoryView.as_view(), name='payment-history'),
    
    # Dashboard
    path('dashboard/stats/', get_dashboard_stats, name='dashboard-stats'),
    
    # Earnings
    path('owner/earnings/', OwnerEarningsListView.as_view(), name='owner-earnings'),
    path('owner/earnings/summary/', get_earning_summary, name='earning-summary'),
    path('password-reset/request/', request_password_reset, name='password-reset-request'),
    path('password-reset/confirm/', reset_password, name='password-reset-confirm'),
]