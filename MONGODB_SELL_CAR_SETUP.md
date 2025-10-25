# MongoDB Setup Guide for Sell Car Submissions

## Overview
This guide explains how to set up MongoDB to store and manage sell car submissions from customers.

## Prerequisites
- MongoDB installed locally or access to MongoDB Atlas
- Node.js environment variables configured
- Admin access to the application

## Environment Variables

Add these environment variables to your `.env` file:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DB_NAME=reride

# For production (MongoDB Atlas)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reride?retryWrites=true&w=majority
# DB_NAME=reride
```

## Database Schema

### Collection: `sellCarSubmissions`

```javascript
{
  _id: ObjectId,
  registration: String,        // Vehicle registration number
  make: String,               // Car make (e.g., "Maruti Suzuki")
  model: String,              // Car model (e.g., "Swift")
  variant: String,            // Car variant (e.g., "VDI")
  year: String,               // Manufacturing year
  district: String,           // Location district
  noOfOwners: String,        // Number of previous owners
  kilometers: String,         // Kilometers driven range
  fuelType: String,          // Fuel type (Petrol, Diesel, etc.)
  transmission: String,      // Transmission type (Manual, Automatic, etc.)
  customerContact: String,   // Customer's mobile number
  submittedAt: String,       // ISO timestamp of submission
  status: String,            // pending, contacted, completed, rejected
  adminNotes: String,        // Admin notes (optional)
  estimatedPrice: Number,    // Estimated price (optional)
  updatedAt: String          // Last update timestamp
}
```

## API Endpoints

### 1. Submit Car Data
```http
POST /api/sell-car
Content-Type: application/json

{
  "registration": "MH01AB1234",
  "make": "Maruti Suzuki",
  "model": "Swift",
  "variant": "VDI",
  "year": "2020",
  "district": "Mumbai",
  "noOfOwners": "First Owner",
  "kilometers": "20,000 Km - 30,000 Km",
  "fuelType": "Diesel",
  "transmission": "Manual",
  "customerContact": "9876543210"
}
```

### 2. Get All Submissions (Admin)
```http
GET /api/sell-car?page=1&limit=10&status=pending&search=MH01
```

### 3. Update Submission (Admin)
```http
PUT /api/sell-car
Content-Type: application/json

{
  "id": "submission_id",
  "status": "contacted",
  "adminNotes": "Customer contacted, inspection scheduled",
  "estimatedPrice": 500000
}
```

### 4. Delete Submission (Admin)
```http
DELETE /api/sell-car?id=submission_id
```

## MongoDB Setup Commands

### 1. Connect to MongoDB
```bash
# Local MongoDB
mongosh

# MongoDB Atlas
mongosh "mongodb+srv://username:password@cluster.mongodb.net/reride"
```

### 2. Create Database and Collection
```javascript
// Switch to reride database
use reride

// Create collection with validation
db.createCollection("sellCarSubmissions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "registration", "make", "model", "variant", "year",
        "district", "noOfOwners", "kilometers", "fuelType",
        "transmission", "customerContact", "submittedAt", "status"
      ],
      properties: {
        registration: {
          bsonType: "string",
          description: "Vehicle registration number is required"
        },
        make: {
          bsonType: "string",
          description: "Car make is required"
        },
        model: {
          bsonType: "string",
          description: "Car model is required"
        },
        variant: {
          bsonType: "string",
          description: "Car variant is required"
        },
        year: {
          bsonType: "string",
          description: "Manufacturing year is required"
        },
        district: {
          bsonType: "string",
          description: "District is required"
        },
        noOfOwners: {
          bsonType: "string",
          description: "Number of owners is required"
        },
        kilometers: {
          bsonType: "string",
          description: "Kilometers driven is required"
        },
        fuelType: {
          bsonType: "string",
          description: "Fuel type is required"
        },
        transmission: {
          bsonType: "string",
          description: "Transmission type is required"
        },
        customerContact: {
          bsonType: "string",
          pattern: "^[6-9]\\d{9}$",
          description: "Valid 10-digit mobile number is required"
        },
        submittedAt: {
          bsonType: "string",
          description: "Submission timestamp is required"
        },
        status: {
          bsonType: "string",
          enum: ["pending", "contacted", "completed", "rejected"],
          description: "Status must be one of: pending, contacted, completed, rejected"
        }
      }
    }
  }
})
```

### 3. Create Indexes for Performance
```javascript
// Index on registration number for uniqueness
db.sellCarSubmissions.createIndex({ "registration": 1 }, { unique: true })

// Index on submission date for sorting
db.sellCarSubmissions.createIndex({ "submittedAt": -1 })

// Index on status for filtering
db.sellCarSubmissions.createIndex({ "status": 1 })

// Index on customer contact for search
db.sellCarSubmissions.createIndex({ "customerContact": 1 })

// Compound index for admin queries
db.sellCarSubmissions.createIndex({ "status": 1, "submittedAt": -1 })
```

## Sample Data Insertion

```javascript
// Insert sample submission
db.sellCarSubmissions.insertOne({
  registration: "MH01AB1234",
  make: "Maruti Suzuki",
  model: "Swift",
  variant: "VDI",
  year: "2020",
  district: "Mumbai",
  noOfOwners: "First Owner",
  kilometers: "20,000 Km - 30,000 Km",
  fuelType: "Diesel",
  transmission: "Manual",
  customerContact: "9876543210",
  submittedAt: new Date().toISOString(),
  status: "pending"
})
```

## Admin Panel Features

### 1. View All Submissions
- Paginated list of all submissions
- Search by registration, make, model, or contact
- Filter by status (pending, contacted, completed, rejected)
- Sort by submission date

### 2. Update Submission Status
- Change status: pending → contacted → completed/rejected
- Add admin notes
- Set estimated price
- Track update history

### 3. Contact Management
- View customer contact details
- Track communication history
- Export contact lists

### 4. Analytics Dashboard
- Total submissions count
- Status distribution
- Monthly submission trends
- Popular car makes/models

## Security Considerations

1. **API Authentication**: Implement admin authentication for API endpoints
2. **Data Validation**: Server-side validation for all inputs
3. **Rate Limiting**: Prevent spam submissions
4. **Data Privacy**: Encrypt sensitive customer data
5. **Access Control**: Role-based access for admin functions

## Monitoring and Maintenance

### 1. Database Monitoring
```javascript
// Check collection stats
db.sellCarSubmissions.stats()

// Monitor slow queries
db.setProfilingLevel(2, { slowms: 100 })
```

### 2. Regular Cleanup
```javascript
// Archive completed submissions older than 1 year
db.sellCarSubmissions.updateMany(
  { 
    status: "completed", 
    submittedAt: { $lt: new Date(Date.now() - 365*24*60*60*1000).toISOString() }
  },
  { $set: { archived: true } }
)
```

### 3. Backup Strategy
```bash
# Create backup
mongodump --db reride --collection sellCarSubmissions --out backup/

# Restore backup
mongorestore --db reride --collection sellCarSubmissions backup/reride/sellCarSubmissions.bson
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check MongoDB service status
   - Verify connection string
   - Check firewall settings

2. **Validation Errors**
   - Ensure all required fields are provided
   - Check data types match schema
   - Verify phone number format

3. **Performance Issues**
   - Check index usage
   - Monitor query execution time
   - Consider data archiving

## Next Steps

1. Set up MongoDB Atlas for production
2. Implement admin authentication
3. Add email notifications for new submissions
4. Create automated price estimation
5. Integrate with CRM systems
6. Add mobile app support

## Support

For technical support or questions about the MongoDB setup:
- Check MongoDB documentation
- Review API endpoint logs
- Contact development team
