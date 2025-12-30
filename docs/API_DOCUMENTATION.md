# API Documentation

BioMedicApp API Documentation - Version 1.0

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via NextAuth.js. Include session cookie in requests.

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... } // Optional, for pagination
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

## Rate Limiting

- Default: 100 requests per minute per IP
- POST/PUT/DELETE: 20 requests per minute per IP
- Headers:
  - `X-RateLimit-Limit`: Maximum requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (ISO string)

## Endpoints

### Devices

#### GET /api/devices

List all devices with optional filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (ACTIVE, INACTIVE, MAINTENANCE, etc.)
- `category` (optional): Filter by category ID
- `location` (optional): Filter by location ID
- `hospitalId` (optional): Filter by hospital ID
- `search` (optional): Search in name, serialNumber, tagNumber, model
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "devices": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### POST /api/devices

Create a new device.

**Request Body:**
```json
{
  "name": "Device Name",
  "model": "Model",
  "serialNumber": "SN123",
  "categoryId": "category-id",
  "locationId": "location-id",
  "hospitalId": "hospital-id",
  "status": "ACTIVE",
  ...
}
```

**Response:**
```json
{
  "success": true,
  "data": { ...device }
}
```

#### GET /api/devices/[id]

Get device by ID.

#### PUT /api/devices/[id]

Update device.

#### DELETE /api/devices/[id]

Delete device.

### Maintenance

#### GET /api/maintenance

List maintenance records.

**Query Parameters:**
- `status` (optional): Filter by status
- `deviceId` (optional): Filter by device ID
- `hospitalId` (optional): Filter by hospital ID

#### POST /api/maintenance

Create maintenance record.

**Request Body:**
```json
{
  "deviceId": "device-id",
  "hospitalId": "hospital-id",
  "type": "PREVENTIVE",
  "status": "SCHEDULED",
  "scheduledDate": "2025-01-15T10:00:00Z",
  "description": "Maintenance description",
  "technicianId": "user-id",
  "cost": 1000
}
```

### Calibration

#### GET /api/calibration

List calibration records.

#### POST /api/calibration

Create calibration record.

### Dashboard

#### GET /api/dashboard

Get dashboard statistics.

**Query Parameters:**
- `hospitalId` (optional): Filter by hospital ID

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalDevices": 100,
      "activeDevices": 85,
      "inMaintenance": 5,
      "needsCalibration": 10,
      "monthlyMaintenanceCost": 50000
    },
    "recentMaintenances": [...],
    "upcomingCalibrations": [...]
  }
}
```

### Work Orders

#### GET /api/work-orders

List work orders.

#### POST /api/work-orders

Create work order.

### Public Endpoints

#### POST /api/public/fault-report

Report a fault (public, no auth required).

**Request Body:**
```json
{
  "deviceId": "device-id",
  "hospitalId": "hospital-id",
  "description": "Fault description",
  "urgency": "HIGH",
  "reporterName": "John Doe",
  "reporterPhone": "+905551234567",
  "reporterTitle": "Nurse"
}
```

## Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Authentication required
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Duplicate entry or conflict
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `429`: Too Many Requests
- `500`: Internal Server Error

