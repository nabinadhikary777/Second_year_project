// Khalti payment configuration
export const khaltiConfig = {
  publicKey: process.env.REACT_APP_KHALTI_PUBLIC_KEY || '',
  productIdentity: 'sawarisewa_vehicle_rental',
  productName: 'SawariSewa Vehicle Rental',
  productUrl: 'http://localhost:3000',
  eventHandler: {
    onSuccess(payload) {
      console.log('Payment success:', payload);
    },
    onError(error) {
      console.log('Payment error:', error);
    },
    onClose() {
      console.log('Widget is closing');
    },
  },
  paymentPreference: ['KHALTI', 'EBANKING', 'MOBILE_BANKING', 'CONNECT_IPS', 'SCT'],
};

export const initializeKhalti = (amount, orderId, orderName, customerInfo) => {
  return {
    publicKey: khaltiConfig.publicKey,
    productIdentity: orderId,
    productName: orderName,
    productUrl: khaltiConfig.productUrl,
    amount: amount * 100, // Convert to paisa
    eventHandler: khaltiConfig.eventHandler,
    paymentPreference: khaltiConfig.paymentPreference,
    customerInfo: customerInfo,
  };
};