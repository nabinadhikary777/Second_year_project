// Khalti payment configuration
export const khaltiConfig = {
  publicKey: 'test_public_key_dc74e0fd57cb46cd93832aee0a390234', // Replace with your actual test/public key
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