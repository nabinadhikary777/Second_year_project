from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
import threading

class EmailThread(threading.Thread):
    """Send emails in background thread to avoid blocking"""
    def __init__(self, subject, html_content, recipient_list):
        self.subject = subject
        self.html_content = html_content
        self.recipient_list = recipient_list
        threading.Thread.__init__(self)

    def run(self):
        text_content = strip_tags(self.html_content)
        msg = EmailMultiAlternatives(
            self.subject, 
            text_content, 
            settings.DEFAULT_FROM_EMAIL,
            self.recipient_list
        )
        msg.attach_alternative(self.html_content, "text/html")
        msg.send()

def send_html_email(subject, template_name, context, recipient_list):
    """Send HTML email using template"""
    html_content = render_to_string(f'emails/{template_name}', context)
    EmailThread(subject, html_content, recipient_list).start()

# ============== BOOKING EMAILS ==============

def send_booking_confirmation_email(booking):
    """Send email when booking is created"""
    context = {
        'customer_name': booking.customer.username,
        'booking_id': booking.id,
        'vehicle': f"{booking.vehicle.brand} {booking.vehicle.model}",
        'start_date': booking.start_date.strftime('%B %d, %Y'),
        'end_date': booking.end_date.strftime('%B %d, %Y'),
        'total_days': booking.total_days,
        'total_amount': booking.total_amount,
        'pickup_location': booking.pickup_location,
        'drop_location': booking.drop_location,
        'owner_name': booking.vehicle.owner.username,
        'owner_phone': booking.vehicle.owner.profile.phone_number,
        'year': timezone.now().year,
        'site_url': 'http://localhost:3000',
    }
    
    send_html_email(
        subject=f'Booking Confirmed - #{booking.id}',
        template_name='booking_confirmation.html',
        context=context,
        recipient_list=[booking.customer.email]
    )
    
    # Also notify owner
    owner_context = {
        'owner_name': booking.vehicle.owner.username,
        'customer_name': booking.customer.username,
        'customer_phone': booking.customer.profile.phone_number,
        'booking_id': booking.id,
        'vehicle': f"{booking.vehicle.brand} {booking.vehicle.model}",
        'start_date': booking.start_date.strftime('%B %d, %Y'),
        'end_date': booking.end_date.strftime('%B %d, %Y'),
        'total_amount': booking.total_amount,
        'year': timezone.now().year,
        'site_url': 'http://localhost:3000',
    }
    
    send_html_email(
        subject=f'New Booking Request - #{booking.id}',
        template_name='owner_booking_notification.html',
        context=owner_context,
        recipient_list=[booking.vehicle.owner.email]
    )

def send_booking_status_update_email(booking, old_status, new_status):
    """Send email when booking status changes"""
    status_messages = {
        'confirmed': 'Your booking has been confirmed!',
        'rejected': 'Your booking request has been rejected.',
        'cancelled': 'Your booking has been cancelled.',
        'completed': 'Your booking has been completed. Thank you for choosing SawariSewa!',
        'ongoing': 'Your rental period has started.',
    }
    
    context = {
        'customer_name': booking.customer.username,
        'booking_id': booking.id,
        'vehicle': f"{booking.vehicle.brand} {booking.vehicle.model}",
        'old_status': old_status,
        'new_status': new_status,
        'message': status_messages.get(new_status, f'Booking status updated to {new_status}'),
        'reason': booking.rejection_reason if new_status == 'rejected' else booking.cancellation_reason,
        'year': timezone.now().year,
        'site_url': 'http://localhost:3000',
    }
    
    send_html_email(
        subject=f'Booking Status Update - #{booking.id}',
        template_name='booking_status_updates.html',
        context=context,
        recipient_list=[booking.customer.email]
    )

def send_payment_confirmation_email(payment):
    """Send email when payment is received"""
    context = {
        'customer_name': payment.customer.username,
        'booking_id': payment.booking.id,
        'payment_id': payment.transaction_id,
        'amount': payment.amount,
        'payment_method': payment.payment_method,
        'payment_date': payment.payment_date.strftime('%B %d, %Y, %I:%M %p'),
        'vehicle': f"{payment.booking.vehicle.brand} {payment.booking.vehicle.model}",
        'year': timezone.now().year,
        'site_url': 'http://localhost:3000',
    }
    
    send_html_email(
        subject=f'Payment Confirmed - रू {payment.amount}',
        template_name='payment_confirmation.html',
        context=context,
        recipient_list=[payment.customer.email]
    )
    
    # Notify owner about payment
    owner_context = {
        'owner_name': payment.owner.username,
        'customer_name': payment.customer.username,
        'booking_id': payment.booking.id,
        'amount': payment.amount,
        'vehicle': f"{payment.booking.vehicle.brand} {payment.booking.vehicle.model}",
        'year': timezone.now().year,
    }
    
    send_html_email(
        subject=f'Payment Received - रू {payment.amount}',
        template_name='owner_payment_notification.html',
        context=owner_context,
        recipient_list=[payment.owner.email]
    )

# ============== REVIEW EMAILS ==============

def send_review_notification_email(review):
    """Notify owner when customer leaves a review"""
    context = {
        'owner_name': review.vehicle.owner.username,
        'customer_name': review.customer.username,
        'vehicle': f"{review.vehicle.brand} {review.vehicle.model}",
        'rating': review.rating,
        'comment': review.comment,
        'review_id': review.id,
        'year': timezone.now().year,
        'site_url': 'http://localhost:3000',
    }
    
    send_html_email(
        subject=f'New Review Received - {review.rating} Stars',
        template_name='review_notification.html',
        context=context,
        recipient_list=[review.vehicle.owner.email]
    )

def send_review_reply_notification_email(review):
    """Notify customer when owner replies to their review"""
    context = {
        'customer_name': review.customer.username,
        'owner_name': review.vehicle.owner.username,
        'vehicle': f"{review.vehicle.brand} {review.vehicle.model}",
        'rating': review.rating,
        'your_review': review.comment,
        'owner_reply': review.owner_reply,
        'year': timezone.now().year,
        'site_url': 'http://localhost:3000',
    }
    
    send_html_email(
        subject=f'Owner Replied to Your Review',
        template_name='review_reply_notification.html',
        context=context,
        recipient_list=[review.customer.email]
    )

# ============== AUTHENTICATION EMAILS ==============

def send_welcome_email(user):
    """Send welcome email after registration"""
    context = {
        'username': user.username,
        'user_type': user.profile.user_type,
        'year': timezone.now().year,
        'site_url': 'http://localhost:3000',
    }
    
    template = 'welcome_customer.html' if user.profile.user_type == 'customer' else 'welcome_owner.html'
    
    send_html_email(
        subject=f'Welcome to SawariSewa, {user.username}!',
        template_name=template,
        context=context,
        recipient_list=[user.email]
    )

def send_password_reset_email(user, token):
    """Send password reset email"""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    site_url = getattr(settings, 'SITE_URL', 'http://localhost:3000').rstrip('/')
    reset_link = f"{site_url}/reset-password?token={token}&uid={uid}"
    
    context = {
        'username': user.username,
        'reset_link': reset_link,
        'expiry_hours': 24,
        'year': timezone.now().year,
        'site_url': site_url,
    }
    
    send_html_email(
        subject='Reset Your Password - SawariSewa',
        template_name='password_reset.html',
        context=context,
        recipient_list=[user.email]
    )