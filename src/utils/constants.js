// Vehicle fuel types
export const FUEL_TYPES = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
];

// Vehicle transmission types
export const TRANSMISSION_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
];

// Vehicle status
export const VEHICLE_STATUS = {
  available: 'Available',
  booked: 'Booked',
  maintenance: 'Under Maintenance',
};

// Booking status
export const BOOKING_STATUS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

// Payment status
export const PAYMENT_STATUS = {
  pending: 'Pending',
  partial: 'Partial',
  completed: 'Completed',
  refunded: 'Refunded',
};

// Booking status colors for UI
export const BOOKING_STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'info',
  ongoing: 'primary',
  completed: 'success',
  cancelled: 'error',
  rejected: 'error',
};

// Nepal cities for dropdown
export const NEPAL_CITIES = [
  'Kathmandu',
  'Pokhara',
  'Lalitpur',
  'Bhaktapur',
  'Biratnagar',
  'Birgunj',
  'Dharan',
  'Bharatpur',
  'Janakpur',
  'Dhangadhi',
  'Butwal',
  'Hetauda',
  'Nepalgunj',
  'Itahari',
  'Tulsipur',
];

// Vehicle categories for Add/Edit Vehicle form
export const VEHICLE_CATEGORIES = [
  { value: 'Car', label: 'Car' },
  { value: 'Bike', label: 'Bike' },
  { value: 'Truck', label: 'Truck' },
];

// Vehicle brands (cars and bikes)
export const VEHICLE_BRANDS = [
  // Cars
  'Toyota',
  'Honda',
  'Hyundai',
  'Suzuki',
  'Mahindra',
  'Tata',
  'Ford',
  'BMW',
  'Audi',
  'Mercedes',
  // Bikes
  'Hero',
  'Bajaj',
  'TVS',
  'Yamaha',
  'Royal Enfield',
  'KTM',
  'Kawasaki',
  'Husqvarna',
  'Ducati',
  'Harley-Davidson',
];

// Vehicle models mapping
export const VEHICLE_MODELS = {
  Toyota: ['Camry', 'Corolla', 'Fortuner', 'Innova', 'Land Cruiser'],
  Honda: ['Civic', 'Accord', 'CR-V', 'City', 'Amaze', 'Activa', 'Shine', 'Unicorn', 'CBR'],
  Hyundai: ['Elantra', 'Tucson', 'Creta', 'i20', 'Verna'],
  Suzuki: ['Swift', 'Vitara', 'Ciaz', 'Ertiga', 'Baleno', 'Access', 'Gixxer', 'Burgman'],
  Mahindra: ['Scorpio', 'XUV500', 'Thar', 'Bolero', 'KUV100'],
  Tata: ['Nexon', 'Harrier', 'Safari', 'Tiago', 'Altroz'],
  Ford: ['EcoSport', 'Endeavour', 'Figo', 'Mustang'],
  BMW: ['X5', 'X3', '3 Series', '5 Series', '7 Series', 'G 310 R', 'G 310 GS'],
  Audi: ['Q5', 'Q7', 'A4', 'A6', 'A8'],
  Mercedes: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE'],
  Hero: ['Splendor', 'Passion', 'Xtreme', 'Karizma', 'Maestro'],
  Bajaj: ['Pulsar', 'Discover', 'Platina', 'Avenger', 'Dominar'],
  TVS: ['Apache', 'Jupiter', 'Sport', 'iQube', 'Ronin'],
  Yamaha: ['FZ', 'R15', 'MT-15', 'Ray', 'Fascino'],
  'Royal Enfield': ['Classic', 'Hunter', 'Meteor', 'Himalayan', 'Bullet'],
  KTM: ['Duke', 'RC', 'Adventure', '390', '250'],
  Kawasaki: ['Ninja', 'Z900', 'W175', 'Dominar'],
  Husqvarna: ['Svartpilen', 'Vitpilen', 'Norden'],
  Ducati: ['Monster', 'Scrambler', 'Panigale', 'Multistrada'],
  'Harley-Davidson': ['Street', 'Sportster', 'Softail', 'Touring'],
};

// Dummy vehicle images
export const DUMMY_VEHICLE_IMAGES = [
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500',
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500',
  'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=500',
];

// Dummy profile images
export const DUMMY_PROFILE_IMAGES = [
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108777-385ef6eebf3e?w=150',
];

// Backend base URL for media files
export const MEDIA_BASE_URL = 'http://localhost:8000';

/**
 * Returns full URL for media/image paths (handles relative paths from API)
 */
export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = MEDIA_BASE_URL.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
};