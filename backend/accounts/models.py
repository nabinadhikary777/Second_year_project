from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

class UserProfile(models.Model):
    USER_TYPES = (
        ('customer', 'Customer'),
        ('owner', 'Vehicle Owner'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='customer')
    phone_number = models.CharField(max_length=15, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, default='Kathmandu')
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.user_type}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()


class VehicleCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    
    class Meta:
        verbose_name_plural = "Vehicle Categories"
    
    def __str__(self):
        return self.name


class Vehicle(models.Model):
    VEHICLE_STATUS = (
        ('available', 'Available'),
        ('booked', 'Booked'),
        ('maintenance', 'Under Maintenance'),
    )
    
    FUEL_TYPES = (
        ('petrol', 'Petrol'),
        ('diesel', 'Diesel'),
        ('electric', 'Electric'),
        ('hybrid', 'Hybrid'),
    )
    
    TRANSMISSION_TYPES = (
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
    )
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    category = models.ForeignKey(VehicleCategory, on_delete=models.SET_NULL, null=True)
    
    # Basic Details
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    registration_number = models.CharField(max_length=50, unique=True)
    
    # Specifications
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPES)
    transmission = models.CharField(max_length=20, choices=TRANSMISSION_TYPES)
    seating_capacity = models.IntegerField()
    mileage = models.FloatField(help_text="Mileage in km/l or km/charge")
    
    # Rental Details
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Location
    city = models.CharField(max_length=100)
    area = models.CharField(max_length=200)
    pickup_instructions = models.TextField(blank=True)
    
    # Images
    main_image = models.ImageField(upload_to='vehicles/')
    image1 = models.ImageField(upload_to='vehicles/', blank=True, null=True)
    image2 = models.ImageField(upload_to='vehicles/', blank=True, null=True)
    image3 = models.ImageField(upload_to='vehicles/', blank=True, null=True)
    
    # Additional Details
    description = models.TextField()
    features = models.TextField(help_text="Comma separated features")
    status = models.CharField(max_length=20, choices=VEHICLE_STATUS, default='available')
    
    # Ratings
    average_rating = models.FloatField(default=0)
    total_reviews = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.brand} {self.model} ({self.year}) - Rs.{self.price_per_day}/day"
    
    def update_rating(self):
        reviews = self.reviews.all()
        if reviews:
            self.average_rating = sum(review.rating for review in reviews) / len(reviews)
            self.total_reviews = len(reviews)
        else:
            self.average_rating = 0
            self.total_reviews = 0
        self.save()


class Booking(models.Model):
    BOOKING_STATUS = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
    )
    
    PAYMENT_STATUS = (
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('completed', 'Completed'),
        ('refunded', 'Refunded'),
    )
    
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='bookings')
    
    # Rental Period
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    pickup_location = models.CharField(max_length=255)
    drop_location = models.CharField(max_length=255)
    
    # Pricing
    total_days = models.IntegerField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    security_deposit_paid = models.BooleanField(default=False)
    
    # Status
    booking_status = models.CharField(max_length=20, choices=BOOKING_STATUS, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    # Additional Info
    special_requests = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Booking #{self.id} - {self.customer.username} - {self.vehicle.brand} {self.vehicle.model}"


class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='reviews')
    
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    
    owner_reply = models.TextField(blank=True)
    owner_replied_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['booking', 'customer']
    
    def __str__(self):
        return f"Review by {self.customer.username} - {self.rating} stars"


class Payment(models.Model):
    PAYMENT_METHODS = (
        ('khalti', 'Khalti'),
        ('esewa', 'eSewa'),
        ('card', 'Credit/Debit Card'),
        ('bank', 'Bank Transfer'),
    )
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments_received')
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    transaction_id = models.CharField(max_length=100, unique=True)
    khalti_token = models.CharField(max_length=500, blank=True)
    
    is_security_deposit = models.BooleanField(default=False)
    is_refund = models.BooleanField(default=False)
    
    status = models.CharField(max_length=20, default='success')
    payment_date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Payment #{self.transaction_id} - Rs.{self.amount}"


class OwnerEarning(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earnings')
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Earning - {self.owner.username} - Rs.{self.net_amount}"


class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications'
    )
    booking = models.ForeignKey('Booking', on_delete=models.CASCADE, null=True, blank=True)
    review = models.ForeignKey('Review', on_delete=models.CASCADE, null=True, blank=True)

    title = models.CharField(max_length=120)
    message = models.TextField()
    action_url = models.CharField(max_length=255, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.username}: {self.title}"