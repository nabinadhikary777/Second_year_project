from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from dj_rest_auth.views import LoginView, LogoutView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/auth/login/', LoginView.as_view(), name='rest_login'),
    path('api/auth/logout/', LogoutView.as_view(), name='rest_logout'),
    # Static pages
    path('about/', TemplateView.as_view(template_name='pages/about.html'), name='page_about'),
    path('contact/', TemplateView.as_view(template_name='pages/contact.html'), name='page_contact'),
    path('terms/', TemplateView.as_view(template_name='pages/terms.html'), name='page_terms'),
    path('privacy/', TemplateView.as_view(template_name='pages/privacy.html'), name='page_privacy'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)