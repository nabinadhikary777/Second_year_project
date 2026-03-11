from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Vehicle, VehicleCategory, Booking, 
    Review, Payment, OwnerEarning
)
from dj_rest_auth.serializers import UserDetailsSerializer

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'user_type', 'phone_number', 'address', 'city', 'profile_picture']

class UserSerializer(UserDetailsSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta(UserDetailsSerializer.Meta):
        fields = UserDetailsSerializer.Meta.fields + ('profile',)

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    user_type = serializers.ChoiceField(choices=UserProfile.USER_TYPES)
    phone_number = serializers.CharField(max_length=15)
    address = serializers.CharField()
    city = serializers.CharField(default='Kathmandu')

    def validate_username(self, username):
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("Username already exists")
        return username

    def validate_email(self, email):
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Email already exists")
        return email

    def validate(self, data):
        if data['password1'] != data['password2']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def save(self, request):
        user = User.objects.create_user(
            username=self.validated_data['username'],
            email=self.validated_data['email'],
            password=self.validated_data['password1']
        )
        
        profile = user.profile
        profile.user_type = self.validated_data['user_type']
        profile.phone_number = self.validated_data['phone_number']
        profile.address = self.validated_data['address']
        profile.city = self.validated_data.get('city', 'Kathmandu')
        profile.save()
        
        return user


class VehicleCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleCategory
        fields = '__all__'

class VehicleSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='owner.username')
    owner_phone = serializers.ReadOnlyField(source='owner.profile.phone_number')
    owner_city = serializers.ReadOnlyField(source='owner.profile.city')
    category_name = serializers.ReadOnlyField(source='category.name')
    
    class Meta:
        model = Vehicle
        fields = '__all__'

class VehicleCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        exclude = ['owner', 'average_rating', 'total_reviews', 'created_at', 'updated_at']

    def _resolve_category(self, value):
        """Accept category as ID (int) or name (str). Resolve name to VehicleCategory."""
        if value is None:
            return None
        if isinstance(value, int) or (isinstance(value, str) and value.isdigit()):
            return VehicleCategory.objects.filter(pk=int(value)).first()
        # Treat as category name (e.g. Car, Bike, Truck)
        category, _ = VehicleCategory.objects.get_or_create(
            name=value.strip(),
            defaults={'description': f'{value} category'}
        )
        return category

    def to_internal_value(self, data):
        # Support both dict and QueryDict (multipart form); resolve category by name if needed
        if hasattr(data, 'get') and 'category' in data:
            cat = data.get('category')
            if cat is not None and cat != '':
                resolved = self._resolve_category(cat)
                if resolved:
                    data = dict(data) if not isinstance(data, dict) else data.copy()
                    data['category'] = resolved.pk
                else:
                    data = dict(data) if not isinstance(data, dict) else data.copy()
                    data['category'] = None
        return super().to_internal_value(data)

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.username')
    customer_phone = serializers.ReadOnlyField(source='customer.profile.phone_number')
    vehicle_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = '__all__'
    
    def get_vehicle_details(self, obj):
        return {
            'id': obj.vehicle.id,
            'brand': obj.vehicle.brand,
            'model': obj.vehicle.model,
            'image': obj.vehicle.main_image.url if obj.vehicle.main_image else None,
            'owner': obj.vehicle.owner.username,
            'owner_phone': obj.vehicle.owner.profile.phone_number
        }

class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['vehicle', 'start_date', 'end_date', 'pickup_location', 
                 'drop_location', 'special_requests']

    def validate(self, data):
        vehicle = data['vehicle']
        
        # Check if vehicle is available
        if vehicle.status != 'available':
            raise serializers.ValidationError("Vehicle is not available for booking")
        
        # Check for overlapping bookings
        overlapping = Booking.objects.filter(
            vehicle=vehicle,
            booking_status__in=['pending', 'confirmed', 'ongoing'],
            start_date__lt=data['end_date'],
            end_date__gt=data['start_date']
        ).exists()
        
        if overlapping:
            raise serializers.ValidationError("Vehicle is already booked for these dates")
        
        # Calculate total days
        delta = data['end_date'] - data['start_date']
        if delta.days < 1:
            raise serializers.ValidationError("Booking must be for at least 1 day")
        
        return data


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.username')
    customer_profile_pic = serializers.ReadOnlyField(source='customer.profile.profile_picture.url')
    
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['customer', 'vehicle', 'booking', 'owner_reply', 'owner_replied_at']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['transaction_id', 'payment_date']


class OwnerEarningSerializer(serializers.ModelSerializer):
    booking_details = serializers.SerializerMethodField()
    
    class Meta:
        model = OwnerEarning
        fields = '__all__'
    
    def get_booking_details(self, obj):
        return {
            'id': obj.booking.id,
            'customer': obj.booking.customer.username,
            'vehicle': f"{obj.booking.vehicle.brand} {obj.booking.vehicle.model}",
            'start_date': obj.booking.start_date,
            'end_date': obj.booking.end_date
        }