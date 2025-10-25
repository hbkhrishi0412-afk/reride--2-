#!/usr/bin/env node

/**
 * Debug script for refresh/renew actions
 */

async function debugRefreshAction() {
    try {
        console.log('🔍 Debugging Refresh Action...');
        
        // Get a vehicle first
        const vehiclesResponse = await fetch('http://localhost:3001/api/vehicles');
        const vehicles = await vehiclesResponse.json();
        
        if (vehicles.length === 0) {
            console.log('❌ No vehicles found');
            return;
        }
        
        const testVehicle = vehicles[0];
        console.log('Test vehicle:', {
            id: testVehicle.id,
            sellerEmail: testVehicle.sellerEmail,
            make: testVehicle.make,
            model: testVehicle.model
        });
        
        // Test refresh action
        console.log('\n🔄 Testing refresh action...');
        const refreshPayload = {
            action: 'refresh',
            vehicleId: testVehicle.id,
            refreshAction: 'refresh',
            sellerEmail: testVehicle.sellerEmail
        };
        
        console.log('Payload:', JSON.stringify(refreshPayload, null, 2));
        
        const response = await fetch('http://localhost:3001/api/vehicles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(refreshPayload)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Response body:', responseText);
        
        if (response.ok) {
            const result = JSON.parse(responseText);
            console.log('✅ Success:', result);
        } else {
            console.log('❌ Error response:', responseText);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugRefreshAction();
