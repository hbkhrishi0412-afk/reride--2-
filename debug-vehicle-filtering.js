#!/usr/bin/env node

/**
 * Debug Vehicle Filtering Issue
 * Test the filtering logic to identify why vehicles aren't showing
 */

async function debugVehicleFiltering() {
    try {
        console.log('🔍 Debugging Vehicle Filtering Issue');
        console.log('====================================\n');
        
        // Get vehicles from API
        const response = await fetch('http://localhost:3001/api/vehicles');
        const vehicles = await response.json();
        
        console.log(`📊 Total vehicles from API: ${vehicles.length}`);
        
        // Test the filtering logic from VehicleList.tsx
        const MIN_PRICE = 50000;
        const MAX_PRICE = 5000000;
        const MIN_MILEAGE = 0;
        const MAX_MILEAGE = 200000;
        
        // Default filter values (same as VehicleList.tsx)
        const filters = {
            categoryFilter: 'ALL',
            makeFilter: '',
            modelFilter: '',
            priceRange: { min: MIN_PRICE, max: MAX_PRICE },
            mileageRange: { min: MIN_MILEAGE, max: MAX_MILEAGE },
            fuelTypeFilter: '',
            yearFilter: '0',
            colorFilter: '',
            stateFilter: '',
            selectedFeatures: []
        };
        
        console.log('\n🔧 Testing with default filters:');
        console.log('Filters:', JSON.stringify(filters, null, 2));
        
        // Apply the same filtering logic as VehicleList.tsx
        const filtered = vehicles.filter(vehicle => {
            // Use early returns for better performance
            if (filters.categoryFilter !== 'ALL' && vehicle.category !== filters.categoryFilter) return false;
            if (filters.makeFilter && vehicle.make !== filters.makeFilter) return false;
            if (filters.modelFilter && vehicle.model !== filters.modelFilter) return false;
            if (vehicle.price < filters.priceRange.min || vehicle.price > filters.priceRange.max) return false;
            if (vehicle.mileage < filters.mileageRange.min || vehicle.mileage > filters.mileageRange.max) return false;
            if (filters.fuelTypeFilter && vehicle.fuelType !== filters.fuelTypeFilter) return false;
            if (filters.yearFilter && filters.yearFilter !== '0' && vehicle.year !== Number(filters.yearFilter)) return false;
            if (filters.colorFilter && vehicle.color !== filters.colorFilter) return false;
            if (filters.stateFilter && vehicle.state !== filters.stateFilter) return false;
            if (filters.selectedFeatures.length > 0 && (!vehicle.features || !filters.selectedFeatures.every(feature => vehicle.features.includes(feature)))) return false;
            
            return true;
        });
        
        console.log(`\n✅ Filtered vehicles: ${filtered.length}`);
        
        if (filtered.length === 0) {
            console.log('\n❌ No vehicles passed the filter! Let\'s debug each condition:');
            
            vehicles.slice(0, 3).forEach((vehicle, index) => {
                console.log(`\n--- Vehicle ${index + 1} Debug ---`);
                console.log(`ID: ${vehicle.id}`);
                console.log(`Make: ${vehicle.make}`);
                console.log(`Model: ${vehicle.model}`);
                console.log(`Category: ${vehicle.category}`);
                console.log(`Price: ${vehicle.price} (range: ${filters.priceRange.min}-${filters.priceRange.max})`);
                console.log(`Mileage: ${vehicle.mileage} (range: ${filters.mileageRange.min}-${filters.mileageRange.max})`);
                console.log(`Year: ${vehicle.year} (filter: ${filters.yearFilter})`);
                console.log(`State: ${vehicle.state} (filter: "${filters.stateFilter}")`);
                console.log(`Fuel Type: ${vehicle.fuelType} (filter: "${filters.fuelTypeFilter}")`);
                
                // Test each condition
                const tests = {
                    category: filters.categoryFilter === 'ALL' || vehicle.category === filters.categoryFilter,
                    make: !filters.makeFilter || vehicle.make === filters.makeFilter,
                    model: !filters.modelFilter || vehicle.model === filters.modelFilter,
                    price: vehicle.price >= filters.priceRange.min && vehicle.price <= filters.priceRange.max,
                    mileage: vehicle.mileage >= filters.mileageRange.min && vehicle.mileage <= filters.mileageRange.max,
                    fuelType: !filters.fuelTypeFilter || vehicle.fuelType === filters.fuelTypeFilter,
                    year: !filters.yearFilter || filters.yearFilter === '0' || vehicle.year === Number(filters.yearFilter),
                    color: !filters.colorFilter || vehicle.color === filters.colorFilter,
                    state: !filters.stateFilter || vehicle.state === filters.stateFilter,
                    features: filters.selectedFeatures.length === 0 || (vehicle.features && filters.selectedFeatures.every(feature => vehicle.features.includes(feature)))
                };
                
                console.log('Filter tests:', tests);
                console.log('All tests pass:', Object.values(tests).every(test => test));
            });
        } else {
            console.log('\n✅ Filtering is working correctly!');
            console.log('Sample filtered vehicles:');
            filtered.slice(0, 3).forEach((vehicle, index) => {
                console.log(`${index + 1}. ${vehicle.year} ${vehicle.make} ${vehicle.model} - ₹${vehicle.price.toLocaleString()}`);
            });
        }
        
        // Test with USED_CARS category filter
        console.log('\n🔧 Testing with USED_CARS category filter:');
        const usedCarsFilter = { ...filters, categoryFilter: 'USED_CARS' };
        const usedCarsFiltered = vehicles.filter(vehicle => {
            if (usedCarsFilter.categoryFilter !== 'ALL' && vehicle.category !== usedCarsFilter.categoryFilter) return false;
            return true;
        });
        console.log(`USED_CARS filter result: ${usedCarsFiltered.length} vehicles`);
        
        // Test with four-wheeler category filter
        console.log('\n🔧 Testing with four-wheeler category filter:');
        const fourWheelerFilter = { ...filters, categoryFilter: 'four-wheeler' };
        const fourWheelerFiltered = vehicles.filter(vehicle => {
            if (fourWheelerFilter.categoryFilter !== 'ALL' && vehicle.category !== fourWheelerFilter.categoryFilter) return false;
            return true;
        });
        console.log(`four-wheeler filter result: ${fourWheelerFiltered.length} vehicles`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

debugVehicleFiltering();
