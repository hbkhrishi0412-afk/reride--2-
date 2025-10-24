// Clear localStorage to force fresh data load
// Run this in browser console to clear cached data

console.log('🧹 Clearing localStorage...');

// Clear all ReRide related data
localStorage.removeItem('reRideUsers');
localStorage.removeItem('reRideVehicles');
localStorage.removeItem('reRideVehicleData');
localStorage.removeItem('reRideConversations');

console.log('✅ localStorage cleared! Refresh the page to load fresh mock data.');
console.log('📝 The seller names should now appear correctly in vehicle listings.');
