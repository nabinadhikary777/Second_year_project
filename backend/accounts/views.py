from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q, Sum, Avg, Count
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from datetime import datetime, timedelta
from .models import (
    Vehicle, Booking, Review, Payment, VehicleCategory, 
    UserProfile, OwnerEarning, Notification
)
from .serializers import (
    UserSerializer, RegisterSerializer, VehicleSerializer,
    VehicleCreateUpdateSerializer, BookingSerializer,
    BookingCreateSerializer, ReviewSerializer, PaymentSerializer,
    VehicleCategorySerializer, OwnerEarningSerializer, NotificationSerializer
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
from django.conf import settings

# Khalti Payment Integration
import requests
from rest_framework.pagination import PageNumberPagination


class VehicleListPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


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

    # Always return a generic success response to avoid leaking which emails exist.
    generic_response = {
        'message': 'If an account exists for this email, a password reset link has been sent.'
    }

    try:
        if not email:
            return Response(generic_response)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response(generic_response)

        token = default_token_generator.make_token(user)

        try:
            send_password_reset_email(user, token)
        except Exception:
            pass  # Don't fail password reset request if email send fails

        return Response(generic_response)
    except Exception:
        return Response(generic_response)

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
    pagination_class = VehicleListPagination
    
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
            # Apply tokenized search so full names like "KTM Duke"
            # can match across brand/model/description/city/category.
            search_terms = [term for term in search.split() if term.strip()]
            for term in search_terms:
                queryset = queryset.filter(
                    Q(brand__icontains=term) |
                    Q(model__icontains=term) |
                    Q(description__icontains=term) |
                    Q(city__icontains=term) |
                    Q(category__name__icontains=term)
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
        else:
            # Default: show newest vehicles first
            queryset = queryset.order_by('-created_at')
        
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
    
    def get_serializer(self, *args, **kwargs):
        # Allow partial updates so we can update without resending all images
        if args and self.request.method in ('PUT', 'PATCH'):
            kwargs['partial'] = True
        return super().get_serializer(*args, **kwargs)

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

        # Notify owner about a new booking request.
        try:
            Notification.objects.create(
                recipient=vehicle.owner,
                actor=self.request.user,
                booking=booking,
                title='New Booking Request',
                message=f'{self.request.user.username} requested to book your {vehicle.brand} {vehicle.model}.',
                action_url='/owner/bookings',
            )
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
            
            # Create/update owner earning (idempotent for repeated status updates)
            commission = booking.total_amount * Decimal('0.10')  # 10% commission
            OwnerEarning.objects.update_or_create(
                owner=booking.vehicle.owner,
                booking=booking,
                defaults={
                    'amount': booking.total_amount,
                    'commission': commission,
                    'net_amount': booking.total_amount - commission,
                }
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

        # Notify customer when owner updates booking status (confirm/cancel/etc.).
        try:
            status_titles = {
                'confirmed': 'Booking Confirmed',
                'cancelled': 'Booking Cancelled',
                'rejected': 'Booking Rejected',
                'ongoing': 'Trip Started',
                'completed': 'Trip Completed',
            }
            title = status_titles.get(new_status, 'Booking Status Updated')
            Notification.objects.create(
                recipient=booking.customer,
                actor=request.user,
                booking=booking,
                title=title,
                message=f'Your booking #{booking.id} is now {new_status}.',
                action_url='/customer/my-bookings',
            )
        except Exception:
            pass
        
        serializer = self.get_serializer(booking)
        return Response(serializer.data)


class CustomerCancelBookingView(generics.UpdateAPIView):
    """Allows customers to cancel their own pending or confirmed bookings."""
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(customer=self.request.user)

    def update(self, request, *args, **kwargs):
        booking = self.get_object()
        old_status = booking.booking_status
        reason = request.data.get('reason', 'Cancelled by customer')

        # Customers can only cancel pending or confirmed bookings
        if old_status not in ['pending', 'confirmed']:
            return Response(
                {'error': f'Cannot cancel booking with status: {old_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.booking_status = 'cancelled'
        booking.cancellation_reason = reason
        booking.vehicle.status = 'available'
        booking.save()
        booking.vehicle.save()

        try:
            send_booking_status_update_email(booking, old_status, 'cancelled')
        except Exception:
            pass

        # Notify owner when customer cancels the booking.
        try:
            Notification.objects.create(
                recipient=booking.vehicle.owner,
                actor=request.user,
                booking=booking,
                title='Booking Cancelled',
                message=f'{request.user.username} cancelled booking #{booking.id}.',
                action_url='/owner/bookings',
            )
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
        
        if booking.booking_status not in ['confirmed', 'ongoing', 'completed']:
            raise serializers.ValidationError(
                "You can review only after booking is confirmed by owner"
            )
        
        # Check if review already exists
        if Review.objects.filter(booking=booking).exists():
            raise serializers.ValidationError("You have already reviewed this booking")
        
        review = serializer.save(
            customer=self.request.user,
            vehicle=booking.vehicle,
            booking=booking
        )

        # Notify vehicle owner about new customer review.
        # Keep review creation resilient even if notification table/migration is missing.
        try:
            Notification.objects.create(
                recipient=booking.vehicle.owner,
                actor=self.request.user,
                booking=booking,
                review=review,
                title='New Review Received',
                message=f'{self.request.user.username} rated your vehicle {review.rating} star(s).',
                action_url='/owner/reviews',
            )
        except Exception:
            pass
        
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
        reply = (request.data.get('reply') or '').strip()
        if not reply:
            return Response({'error': 'Reply is required'}, status=400)
        
        review.owner_reply = reply
        review.owner_replied_at = timezone.now()
        review.save()

        # Notify customer when owner replies.
        try:
            Notification.objects.create(
                recipient=review.customer,
                actor=request.user,
                booking=review.booking,
                review=review,
                title='Owner Replied to Your Review',
                message=f'{request.user.username} replied to your review.',
                action_url=f'/customer/booking-detail/{review.booking.id}',
            )
        except Exception:
            pass
        
        try:
            send_review_reply_notification_email(review)
        except Exception:
            pass
        
        serializer = ReviewSerializer(review)
        return Response(serializer.data)


class OwnerReviewsListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Review.objects.filter(vehicle__owner=self.request.user).order_by('-created_at')
        vehicle_id = self.request.query_params.get('vehicle_id')
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        return queryset


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    queryset = Notification.objects.filter(recipient=request.user).order_by('-created_at')[:30]
    unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
    serializer = NotificationSerializer(queryset, many=True)
    return Response({
        'results': serializer.data,
        'unread_count': unread_count,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)
    notification.is_read = True
    notification.save(update_fields=['is_read'])
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({'success': True})

# ============== PAYMENT VIEWS ==============
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_khalti_payment(request):
    booking_id = request.data.get('booking_id')
    
    try:
        booking = Booking.objects.get(id=booking_id, customer=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
    
    base = getattr(settings, 'KHALTI_API_URL', 'https://dev.khalti.com/api/v2').rstrip('/')
    url = f"{base}/epayment/initiate/"
    
    # Use configured frontend/site URL so it matches Khalti merchant settings.
    site_url = getattr(settings, 'SITE_URL', 'http://localhost:3000').rstrip('/')
    return_url = f"{site_url}/customer/payment/{booking.id}"

    # Khalti ePayment requires amount in paisa and minimum Rs 10.
    amount_paisa = int(booking.total_amount * 100)
    if amount_paisa < 1000:
        return Response(
            {'error': 'Minimum Khalti payment is Rs 10 (1000 paisa).'},
            status=400
        )

    # Prepare payment data
    payload = {
        "return_url": return_url,
        "website_url": site_url,
        "amount": amount_paisa,  # In paisa
        "purchase_order_id": f"BOOKING_{booking.id}",
        "purchase_order_name": f"Vehicle Rental - {booking.vehicle.brand} {booking.vehicle.model}",
        "customer_info": {
            "name": request.user.username,
            "email": request.user.email or "test@example.com",
            "phone": getattr(request.user.profile, 'phone_number', None) or "9800000000"
        }
    }
    
    headers = {
        'Authorization': f'Key {getattr(settings, "KHALTI_SECRET_KEY", "")}',
        'Content-Type': 'application/json',
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        if response.status_code >= 400:
            err_msg = data.get('detail') or data.get('error') or str(data)
            return Response({'error': err_msg, 'raw': data}, status=response.status_code)
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_khalti_payment(request):
    pidx = request.data.get('pidx')
    booking_id = request.data.get('booking_id')
    total_amount = request.data.get('total_amount')
    
    base = getattr(settings, 'KHALTI_API_URL', 'https://dev.khalti.com/api/v2').rstrip('/')
    url = f"{base}/epayment/lookup/"
    payload = {
        "pidx": pidx
    }
    
    headers = {
        'Authorization': f'Key {getattr(settings, "KHALTI_SECRET_KEY", "")}',
        'Content-Type': 'application/json',
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        
        if data.get('status') == 'Completed':
            try:
                booking = Booking.objects.get(id=booking_id, customer=request.user)
            except Booking.DoesNotExist:
                return Response({'error': 'Booking not found'}, status=404)

            # Prefer trusted Khalti amount (paisa) instead of client-provided value.
            khalti_total_paisa = data.get('total_amount')
            if khalti_total_paisa is not None:
                amount_rupees = (Decimal(str(khalti_total_paisa)) / Decimal('100')).quantize(Decimal('0.01'))
            else:
                amount_rupees = Decimal(str(total_amount or 0))

            transaction_id = data.get('transaction_id') or pidx
            if not transaction_id:
                return Response({'error': 'Missing transaction id from Khalti response'}, status=400)

            with transaction.atomic():
                payment, created = Payment.objects.get_or_create(
                    transaction_id=transaction_id,
                    defaults={
                        'booking': booking,
                        'customer': request.user,
                        'owner': booking.vehicle.owner,
                        'amount': amount_rupees,
                        'payment_method': 'khalti',
                        'khalti_token': pidx or '',
                    }
                )

                # Idempotent verification: if already saved, return success without mutating totals again.
                if created:
                    booking.paid_amount += Decimal(str(payment.amount))
                    if booking.paid_amount >= booking.total_amount:
                        booking.payment_status = 'completed'
                        booking.security_deposit_paid = True
                    else:
                        booking.payment_status = 'partial'
                    booking.save()

                    # Reflect owner earnings as soon as payment succeeds.
                    # Keep one earning row per booking and update it as paid amount changes.
                    earning_amount = booking.paid_amount
                    commission = earning_amount * Decimal('0.10')
                    OwnerEarning.objects.update_or_create(
                        owner=booking.vehicle.owner,
                        booking=booking,
                        defaults={
                            'amount': earning_amount,
                            'commission': commission,
                            'net_amount': earning_amount - commission,
                        }
                    )

                    try:
                        send_payment_confirmation_email(payment)
                    except Exception:
                        pass

                    # Notify owner when customer payment is successful.
                    try:
                        Notification.objects.create(
                            recipient=booking.vehicle.owner,
                            actor=request.user,
                            booking=booking,
                            title='Payment Received',
                            message=f'{request.user.username} completed payment for booking #{booking.id}.',
                            action_url='/owner/bookings',
                        )
                    except Exception:
                        pass

            serializer = PaymentSerializer(payment)
            return Response(serializer.data)
        
        return Response({'error': 'Payment not completed'}, status=400)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_khalti_test_payment(request):
    """
    Initiate a Khalti test transaction (Rs 10 minimum). No booking required.
    Returns payment_url for redirect. Use ePayment flow.
    """
    from django.conf import settings as django_settings
    site_url = getattr(django_settings, 'SITE_URL', 'http://localhost:3000').rstrip('/')
    return_url = f"{site_url}/customer/khalti-test"

    base = getattr(django_settings, 'KHALTI_API_URL', 'https://dev.khalti.com/api/v2').rstrip('/')
    url = f"{base}/epayment/initiate/"
    payload = {
        "return_url": return_url,
        "website_url": site_url,
        "amount": 1000,  # Rs 10 minimum (Khalti requirement)
        "purchase_order_id": f"TEST_{request.user.id}_{uuid.uuid4().hex[:8]}",
        "purchase_order_name": "SawariSewa - Khalti Test Payment",
        "customer_info": {
            "name": request.user.username,
            "email": request.user.email or "test@example.com",
            "phone": getattr(request.user.profile, 'phone_number', None) or "9800000000",
        }
    }

    secret_key = getattr(settings, 'KHALTI_SECRET_KEY', '')
    headers = {
        'Authorization': f'Key {secret_key}',
        'Content-Type': 'application/json',
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        if 'payment_url' in data:
            return Response(data)
        # Use 400 (not 401) for Khalti API errors - frontend treats 401 as "redirect to login"
        err_msg = data.get('detail') or data.get('error') or str(data)
        if 'invalid token' in str(err_msg).lower():
            err_msg = (
                f"{err_msg} Get your Live secret key from https://test-admin.khalti.com/ "
                "(sign up as merchant, then Developer → Keys)."
            )
        return Response({'error': err_msg, 'raw': data}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_khalti_test_payment(request):
    """
    Verify a Khalti test transaction (no DB save).
    Use this to test the payment flow with minimal amount (e.g., Rs 1).
    """
    pidx = request.data.get('pidx')
    if not pidx:
        return Response({'error': 'pidx is required'}, status=400)

    base = getattr(settings, 'KHALTI_API_URL', 'https://dev.khalti.com/api/v2').rstrip('/')
    url = f"{base}/epayment/lookup/"
    payload = {"pidx": pidx}
    headers = {
        'Authorization': f'Key {getattr(settings, "KHALTI_SECRET_KEY", "")}',
        'Content-Type': 'application/json',
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        data = response.json()
        return Response({
            'success': data.get('status') == 'Completed',
            'status': data.get('status'),
            'transaction_id': data.get('transaction_id'),
            'amount': data.get('total_amount'),
            'raw_response': data,
        })
    except Exception as e:
        return Response({'error': str(e), 'success': False}, status=500)


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