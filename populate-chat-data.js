// Script to populate chat data for testing
const sampleConversations = [
  {
    id: "conv_test_1",
    customerId: "customer@test.com",
    customerName: "John Doe",
    sellerId: "seller@test.com",
    vehicleId: 1,
    vehicleName: "2024 Mahindra Thar LX",
    vehiclePrice: 1500000,
    messages: [
      {
        id: 1,
        sender: "user",
        text: "Hi, I'm interested in this Mahindra Thar. Is it still available?",
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        isRead: true,
        type: "text"
      },
      {
        id: 2,
        sender: "seller",
        text: "Yes, it's still available! The vehicle is in excellent condition with only 5,000 km on the odometer.",
        timestamp: new Date(Date.now() - 3500000).toISOString(), // 58 minutes ago
        isRead: true,
        type: "text"
      },
      {
        id: 3,
        sender: "user",
        text: "That sounds great! Can I schedule a test drive?",
        timestamp: new Date(Date.now() - 3400000).toISOString(), // 56 minutes ago
        isRead: true,
        type: "text"
      },
      {
        id: 4,
        sender: "seller",
        text: "Absolutely! I can arrange a test drive for you. What time works best for you?",
        timestamp: new Date(Date.now() - 3300000).toISOString(), // 55 minutes ago
        isRead: false,
        type: "text"
      }
    ],
    lastMessageAt: new Date(Date.now() - 3300000).toISOString(),
    isReadBySeller: false,
    isReadByCustomer: true,
    isFlagged: false
  },
  {
    id: "conv_test_2",
    customerId: "customer@test.com",
    customerName: "John Doe",
    sellerId: "seller@test.com",
    vehicleId: 2,
    vehicleName: "2023 Honda City",
    vehiclePrice: 1200000,
    messages: [
      {
        id: 5,
        sender: "user",
        text: "Hello, I saw your Honda City listing. What's the best price you can offer?",
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        isRead: true,
        type: "text"
      },
      {
        id: 6,
        sender: "seller",
        text: "Hi! The listed price is ₹12,00,000, but I can offer you ₹11,50,000 if you're serious about buying.",
        timestamp: new Date(Date.now() - 7100000).toISOString(), // 1 hour 58 minutes ago
        isRead: true,
        type: "text"
      }
    ],
    lastMessageAt: new Date(Date.now() - 7100000).toISOString(),
    isReadBySeller: true,
    isReadByCustomer: true,
    isFlagged: false
  }
];

// Save to localStorage
if (typeof localStorage !== 'undefined') {
  localStorage.setItem('reRideConversations', JSON.stringify(sampleConversations));
  console.log('✅ Sample conversations saved to localStorage');
  console.log('Conversations:', sampleConversations);
} else {
  console.log('❌ localStorage not available (running in Node.js)');
  console.log('Sample conversations:', JSON.stringify(sampleConversations, null, 2));
}
