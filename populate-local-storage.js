// Script to populate local storage with mock data for development
import { MOCK_USERS, MOCK_VEHICLES } from './constants.ts';

// This will be run in the browser console to populate local storage
const populateLocalStorage = () => {
  console.log('Populating local storage with mock data...');
  
  // Store users
  localStorage.setItem('reRideUsers', JSON.stringify(MOCK_USERS));
  console.log(`✅ Stored ${MOCK_USERS.length} users in local storage`);
  
  // Store vehicles
  localStorage.setItem('reRideVehicles', JSON.stringify(MOCK_VEHICLES));
  console.log(`✅ Stored ${MOCK_VEHICLES.length} vehicles in local storage`);
  
  console.log('\n🎉 Local storage populated successfully!');
  console.log('\n📋 Available test accounts:');
  console.log('   Admin: admin@test.com / password');
  console.log('   Customer: customer@test.com / password');
  console.log('   Seller: seller@test.com / password');
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.populateLocalStorage = populateLocalStorage;
}

export default populateLocalStorage;
