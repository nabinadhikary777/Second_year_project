from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db.models import Q, Sum, Avg, Count
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from datetime import datetime, timedelta
from .models import (
    Vehicle, Booking, Review, Payment, VehicleCategory, 
    UserProfile, OwnerEarning
)
from .serializers import (
    UserSerializer, RegisterSerializer, VehicleSerializer,
    VehicleCreateUpdateSerializer, BookingSerializer,
    BookingCreateSerializer, ReviewSerializer, PaymentSerializer,
    VehicleCategorySerializer, OwnerEarningSerializer
)
from .utils.email import (
    send_booking_confirmation_email,
    send_booking_status_update_email,
    send_payment_confirmation_email,
    send_review_notification_email,
    send_review_reply_notification_email,
    send_welcome_email,
    send_password_reset_email
)
import uuid
import json
from decimal import Decimal

# Khalti Payment Integration
import requests

# ============== AUTHENTICATION VIEWS ==============
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    user = request.user
    profile = user.profile
    
    data = request.data
    
    # Update user fields
    if 'email' in data and data['email'] != user.email:
        if User.objects.filter(email=data['email']).exclude(id=user.id).exists():
            return Response({'error': 'Email already exists'}, status=400)
        user.email = data['email']
    
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    
    user.save()
    
    # Update profile fields
    if 'phone_number' in data:
        profile.phone_number = data['phone_number']
    if 'address' in data:
        profile.address = data['address']
    if 'city' in data:
        profile.city = data['city']
    if 'profile_picture' in request.FILES:
        profile.profile_picture = request.FILES['profile_picture']
    
    profile.save()
    
    serializer = UserSerializer(user)
    return Response(serializer.data)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    def perform_create(self, serializer):
        user = serializer.save(self.request)
        try:
            send_welcome_email(user)
        except Exception:
            pass  # Don't fail registration if email fails
        return user

# ============== PASSWORD RESET VIEWS ==============
@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    email = request.data.get('email')
    
    try:
        user = User.objects.get(email=email)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        try:
            send_password_reset_email(user, token)
        except Exception:
            pass  # Don't fail if email fails (e.g. console backend)
        return Response({'message': 'Password reset email sent successfully'})
    except User.DoesNotExist:
        return Response({'error': 'User with this email does not exist'}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
        
        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password reset successful'})
        else:
            return Response({'error': 'Invalid or expired token'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

# ============== VEHICLE CATEGORY VIEWS ==============
class VehicleCategoryListView(generics.ListAPIView):
    queryset = VehicleCategory.objects.all()
    serializer_class = VehicleCategorySerializer
    permission_classes = [AllowAny]

# ============== VEHICLE VIEWS ==============
class VehicleListView(generics.ListAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Vehicle.objects.filter(status='available')
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Filter by city
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price_per_day__gte=min_price)
        if max_price:
            queryset = queryset.filter(price_per_day__lte=max_price)
        
        # Filter by fuel type
        fuel_type = self.request.query_params.get('fuel_type')
        if fuel_type:
            queryset = queryset.filter(fuel_type=fuel_type)
        
        # Filter by transmission
        transmission = self.request.query_params.get('transmission')
        if transmission:
            queryset = queryset.filter(transmission=transmission)
        
        # Filter by seating capacity
        seats = self.request.query_params.get('seats')
        if seats:
            queryset = queryset.filter(seating_capacity__gte=seats)
        
        # Search by brand/model
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(brand__icontains=search) | 
                Q(model__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Sort by
        sort_by = self.request.query_params.get('sort_by')
        if sort_by == 'price_low':
            queryset = queryset.order_by('price_per_day')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-price_per_day')
        elif sort_by == 'rating':
            queryset = queryset.order_by('-average_rating')
        elif sort_by == 'newest':
            queryset = queryset.order_by('-year')
        
        return queryset

class VehicleDetailView(generics.RetrieveAPIView):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [AllowAny]

class OwnerVehicleListView(generics.ListAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Vehicle.objects.filter(owner=self.request.user).order_by('-created_at')

class OwnerVehicleCreateView(generics.CreateAPIView):
    serializer_class = VehicleCreateUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        if self.request.user.profile.user_type != 'owner':
            raise serializers.ValidationError("Only vehicle owners can list vehicles")
        serializer.save()

class OwnerVehicleUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = VehicleCreateUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Vehicle.objects.filter(owner=self.request.user)

class OwnerVehicleDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Vehicle.objects.filter(owner=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        vehicle = self.get_object()
        # Check if vehicle has any active bookings
        if vehicle.bookings.filter(booking_status__in=['pending', 'confirmed', 'ongoing']).exists():
            return Response(
                {'error': 'Cannot delete vehicle with active bookings'},
                status=status.HTTP_400_BAD_REQUEST
            )
        vehicle.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# ============== BOOKING VIEWS ==============
class CreateBookingView(generics.CreateAPIView):
    serializer_class = BookingCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        vehicle = serializer.validated_data['vehicle']
        
        # Calculate total days
        start = serializer.validated_data['start_date']
        end = serializer.validated_data['end_date']
        days = (end - start).days
        
        total_amount = vehicle.price_per_day * days
        
        booking = serializer.save(
            customer=self.request.user,
            total_days=days,
            total_amount=total_amount,
            booking_status='pending'
        )
        
        # Update vehicle status temporarily
        vehicle.status = 'booked'
        vehicle.save()
        
        try:
            send_booking_confirmation_email(booking)
        except Exception:
            pass

class CustomerBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        status = self.request.query_params.get('status')
        queryset = Booking.objects.filter(customer=self.request.user)
        if status and status != 'all':
            queryset = queryset.filter(booking_status=status)
        return queryset.order_by('-created_at')

class OwnerBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        status = self.request.query_params.get('status')
        queryset = Booking.objects.filter(vehicle__owner=self.request.user)
        if status and status != 'all':
            queryset = queryset.filter(booking_status=status)
        return queryset.order_by('-created_at')

class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.profile.user_type == 'owner':
            return Booking.objects.filter(vehicle__owner=user)
        return Booking.objects.filter(customer=user)

class UpdateBookingStatusView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer
    
    def get_queryset(self):
        return Booking.objects.filter(vehicle__owner=self.request.user)
    
    def update(self, request, *args, **kwargs):
        booking = self.get_object()
        old_status = booking.booking_status
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')
        
        valid_transitions = {
            'pending': ['confirmed', 'rejected'],
            'confirmed': ['ongoing', 'cancelled'],
            'ongoing': ['completed'],
            'completed': [],
            'cancelled': [],
            'rejected': []
        }
        
        if new_status not in valid_transitions.get(booking.booking_status, []):
            return Response(
                {'error': f'Cannot change status from {booking.booking_status} to {new_status}'},
                status=400
            )
        
        booking.booking_status = new_status
        
        if new_status == 'confirmed':
            booking.vehicle.status = 'booked'
        elif new_status == 'completed':
            booking.vehicle.status = 'available'
            booking.payment_status = 'completed'
            
            # Create owner earning
            commission = booking.total_amount * Decimal('0.10')  # 10% commission
            OwnerEarning.objects.create(
                owner=booking.vehicle.owner,
                booking=booking,
                amount=booking.total_amount,
                commission=commission,
                net_amount=booking.total_amount - commission
            )
        elif new_status in ['cancelled', 'rejected']:
            booking.vehicle.status = 'available'
            if new_status == 'rejected':
                booking.rejection_reason = reason
            else:
                booking.cancellation_reason = reason
        
        booking.save()
        booking.vehicle.save()
        
        try:
            send_booking_status_update_email(booking, old_status, new_status)
        except Exception:
            pass
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)

# ============== REVIEW VIEWS ==============
class CreateReviewView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        booking_id = self.kwargs.get('booking_id')
        booking = Booking.objects.get(id=booking_id)
        
        if booking.customer != self.request.user:
            raise serializers.ValidationError("You can only review your own bookings")
        
        if booking.booking_status != 'completed':
            raise serializers.ValidationError("You can only review completed bookings")
        
        # Check if review already exists
        if Review.objects.filter(booking=booking).exists():
            raise serializers.ValidationError("You have already reviewed this booking")
        
        review = serializer.save(
            customer=self.request.user,
            vehicle=booking.vehicle,
            booking=booking
        )
        
        # Update vehicle rating
        booking.vehicle.update_rating()
        
        try:
            send_review_notification_email(review)
        except Exception:
            pass

class VehicleReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        vehicle_id = self.kwargs.get('vehicle_id')
        return Review.objects.filter(vehicle_id=vehicle_id).order_by('-created_at')

class ReplyToReviewView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Review.objects.filter(vehicle__owner=self.request.user)
    
    def update(self, request, *args, **kwargs):
        review = self.get_object()
        reply = request.data.get('reply')
        
        review.owner_reply = reply
        review.owner_replied_at = timezone.now()
        review.save()
        
        try:
            send_review_reply_notification_email(review)
        except Exception:
            pass
        
        serializer = ReviewSerializer(review)
        return Response(serializer.data)

# ============== PAYMENT VIEWS ==============
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_khalti_payment(request):
    booking_id = request.data.get('booking_id')
    
    try:
        booking = Booking.objects.get(id=booking_id, customer=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
    
    # Khalti API endpoint
    url = "https://dev.khalti.com/api/v2/epayment/initiate/"
    
    # Prepare payment data
    payload = {
        "return_url": "http://localhost:3000/payment/success",
        "website_url": "http://localhost:3000",
        "amount": int(booking.total_amount * 100),  # In paisa
        "purchase_order_id": f"BOOKING_{booking.id}",
        "purchase_order_name": f"Vehicle Rental - {booking.vehicle.brand} {booking.vehicle.model}",
        "customer_info": {
            "name": request.user.username,
            "email": request.user.email,
            "phone": request.user.profile.phone_number
        }
    }
    
    headers = {
        'Authorization': 'key your_khalti_secret_key',
        'Content-Type': 'application/json',
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        return Response(response.json())
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_khalti_payment(request):
    pidx = request.data.get('pidx')
    booking_id = request.data.get('booking_id')
    total_amount = request.data.get('total_amount')
    
    url = "https://dev.khalti.com/api/v2/epayment/lookup/"
    payload = {
        "pidx": pidx
    }
    
    headers = {
        'Authorization': 'key your_khalti_secret_key',
        'Content-Type': 'application/json',
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        
        if data.get('status') == 'Completed':
            booking = Booking.objects.get(id=booking_id)
            
            # Create payment record
            payment = Payment.objects.create(
                booking=booking,
                customer=request.user,
                owner=booking.vehicle.owner,
                amount=total_amount,
                payment_method='khalti',
                transaction_id=data.get('transaction_id'),
                khalti_token=pidx
            )
            
            # Update booking payment status
            booking.paid_amount += Decimal(str(total_amount))
            if booking.paid_amount >= booking.total_amount:
                booking.payment_status = 'completed'
                booking.security_deposit_paid = True
            else:
                booking.payment_status = 'partial'
            booking.save()
            
            try:
                send_payment_confirmation_email(payment)
            except Exception:
                pass
            
            serializer = PaymentSerializer(payment)
            return Response(serializer.data)
        
        return Response({'error': 'Payment not completed'}, status=400)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

class PaymentHistoryView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(customer=self.request.user).order_by('-payment_date')

# ============== DASHBOARD STATS ==============
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_stats(request):
    user = request.user
    
    if user.profile.user_type == 'customer':
        # Customer stats
        total_bookings = Booking.objects.filter(customer=user).count()
        active_bookings = Booking.objects.filter(
            customer=user, 
            booking_status__in=['confirmed', 'ongoing']
        ).count()
        completed_bookings = Booking.objects.filter(
            customer=user, 
            booking_status='completed'
        ).count()
        
        total_spent = Payment.objects.filter(
            customer=user, 
            is_refund=False
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        recent_bookings = Booking.objects.filter(customer=user).order_by('-created_at')[:5]
        recent_bookings_data = BookingSerializer(recent_bookings, many=True).data
        
        stats = {
            'total_bookings': total_bookings,
            'active_bookings': active_bookings,
            'completed_bookings': completed_bookings,
            'total_spent': total_spent,
            'recent_bookings': recent_bookings_data
        }
    else:  # owner
        # Owner stats
        total_vehicles = Vehicle.objects.filter(owner=user).count()
        active_vehicles = Vehicle.objects.filter(owner=user, status='available').count()
        booked_vehicles = Vehicle.objects.filter(owner=user, status='booked').count()
        
        total_bookings = Booking.objects.filter(vehicle__owner=user).count()
        pending_bookings = Booking.objects.filter(
            vehicle__owner=user, 
            booking_status='pending'
        ).count()
        confirmed_bookings = Booking.objects.filter(
            vehicle__owner=user, 
            booking_status='confirmed'
        ).count()
        completed_bookings = Booking.objects.filter(
            vehicle__owner=user, 
            booking_status='completed'
        ).count()
        
        total_earnings = OwnerEarning.objects.filter(
            owner=user, 
            is_paid=False
        ).aggregate(Sum('net_amount'))['net_amount__sum'] or 0
        
        paid_earnings = OwnerEarning.objects.filter(
            owner=user, 
            is_paid=True
        ).aggregate(Sum('net_amount'))['net_amount__sum'] or 0
        
        recent_bookings = Booking.objects.filter(vehicle__owner=user).order_by('-created_at')[:5]
        recent_bookings_data = BookingSerializer(recent_bookings, many=True).data
        
        stats = {
            'total_vehicles': total_vehicles,
            'active_vehicles': active_vehicles,
            'booked_vehicles': booked_vehicles,
            'total_bookings': total_bookings,
            'pending_bookings': pending_bookings,
            'confirmed_bookings': confirmed_bookings,
            'completed_bookings': completed_bookings,
            'total_earnings': total_earnings,
            'paid_earnings': paid_earnings,
            'recent_bookings': recent_bookings_data
        }
    
    return Response(stats)

# ============== EARNINGS VIEWS ==============
class OwnerEarningsListView(generics.ListAPIView):
    serializer_class = OwnerEarningSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return OwnerEarning.objects.filter(owner=self.request.user).order_by('-created_at')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_earning_summary(request):
    user = request.user
    
    # Monthly earnings for chart
    six_months_ago = timezone.now() - timedelta(days=180)
    earnings = OwnerEarning.objects.filter(
        owner=user,
        created_at__gte=six_months_ago
    ).values('created_at__month').annotate(
        total=Sum('net_amount')
    ).order_by('created_at__month')
    
    # Bookings by vehicle
    vehicle_earnings = Vehicle.objects.filter(owner=user).annotate(
        total_earnings=Sum('bookings__ownerearning__net_amount'),
        total_bookings=Count('bookings')
    ).values('id', 'brand', 'model', 'total_earnings', 'total_bookings')
    
    return Response({
        'monthly_earnings': earnings,
        'vehicle_earnings': vehicle_earnings
    })