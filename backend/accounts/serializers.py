from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Vehicle, VehicleCategory, Booking, 
    Review, Payment, OwnerEarning, Notification
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
    main_image = serializers.SerializerMethodField()
    image1 = serializers.SerializerMethodField()
    image2 = serializers.SerializerMethodField()
    image3 = serializers.SerializerMethodField()
    
    class Meta:
        model = Vehicle
        fields = '__all__'
    
    def _get_image_url(self, image_field):
        if not image_field:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(image_field.url)
        return image_field.url
    
    def get_main_image(self, obj):
        return self._get_image_url(obj.main_image)
    
    def get_image1(self, obj):
        return self._get_image_url(obj.image1)
    
    def get_image2(self, obj):
        return self._get_image_url(obj.image2)
    
    def get_image3(self, obj):
        return self._get_image_url(obj.image3)

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
    has_review = serializers.SerializerMethodField()
    review_rating = serializers.SerializerMethodField()
    review_comment = serializers.SerializerMethodField()
    owner_reply = serializers.SerializerMethodField()
    owner_replied_at = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = '__all__'
    
    def get_vehicle_details(self, obj):
        request = self.context.get('request')
        image_url = obj.vehicle.main_image.url if obj.vehicle.main_image else None
        if request and image_url:
            image_url = request.build_absolute_uri(image_url)
        return {
            'id': obj.vehicle.id,
            'brand': obj.vehicle.brand,
            'model': obj.vehicle.model,
            'image': image_url,
            'owner': obj.vehicle.owner.username,
            'owner_phone': obj.vehicle.owner.profile.phone_number
        }

    def get_has_review(self, obj):
        return hasattr(obj, 'review')

    def get_review_rating(self, obj):
        review = getattr(obj, 'review', None)
        return review.rating if review else None

    def get_review_comment(self, obj):
        review = getattr(obj, 'review', None)
        return review.comment if review else ''

    def get_owner_reply(self, obj):
        review = getattr(obj, 'review', None)
        return review.owner_reply if review else ''

    def get_owner_replied_at(self, obj):
        review = getattr(obj, 'review', None)
        return review.owner_replied_at if review else None

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
    customer_profile_pic = serializers.SerializerMethodField()
    vehicle_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['customer', 'vehicle', 'booking', 'owner_reply', 'owner_replied_at']

    def get_customer_profile_pic(self, obj):
        profile = getattr(obj.customer, 'profile', None)
        picture = getattr(profile, 'profile_picture', None)
        if picture:
            return picture.url
        return None

    def get_vehicle_name(self, obj):
        return f"{obj.vehicle.brand} {obj.vehicle.model}"


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


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = '__all__'

    def get_actor_name(self, obj):
        return obj.actor.username if obj.actor else None