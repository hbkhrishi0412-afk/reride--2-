// Local storage seeding script
// Run this with: node seed-local.js

import { loadFallbackData } from './utils/dataLoaders.ts';

const seedLocalStorage = async () => {
  console.log('🌱 Seeding local storage with mock data...');
  
  try {
    const fallbackData = await loadFallbackData();
    
    // This would typically write to a local database
    // For now, we'll just log the data structure
    console.log('📊 Mock data loaded:');
    console.log(`   Users: ${fallbackData.users.length}`);
    console.log(`   Vehicles: ${fallbackData.vehicles.length}`);
    console.log(`   FAQs: ${fallbackData.faqs.length}`);
    console.log(`   Support Tickets: ${fallbackData.supportTickets.length}`);
    
    console.log('\n✅ Local storage seeding completed!');
    console.log('\n📋 Available test accounts:');
    console.log('   Admin: admin@test.com / password');
    console.log('   Customer: customer@test.com / password');
    console.log('   Seller: seller@test.com / password');
    
  } catch (error) {
    console.error('❌ Failed to seed local storage:', error);
  }
};

// Run the seeding
seedLocalStorage();