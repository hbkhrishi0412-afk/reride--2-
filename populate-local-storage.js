// Script to populate local storage with mock data for development
import { loadFallbackData } from './utils/dataLoaders.ts';

// This will be run in the browser console to populate local storage
const populateLocalStorage = async () => {
  console.log('Populating local storage with mock data...');
  
  try {
    const fallbackData = await loadFallbackData();
    
    // Store users
    localStorage.setItem('reRideUsers', JSON.stringify(fallbackData.users));
    console.log(`✅ Stored ${fallbackData.users.length} users in local storage`);
    
    // Store vehicles
    localStorage.setItem('reRideVehicles', JSON.stringify(fallbackData.vehicles));
    console.log(`✅ Stored ${fallbackData.vehicles.length} vehicles in local storage`);
    
    console.log('\n🎉 Local storage populated successfully!');
    console.log('\n📋 Available test accounts:');
    console.log('   Admin: admin@test.com / password');
    console.log('   Customer: customer@test.com / password');
    console.log('   Seller: seller@test.com / password');
  } catch (error) {
    console.error('❌ Failed to populate local storage:', error);
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.populateLocalStorage = populateLocalStorage;
}

export default populateLocalStorage;
