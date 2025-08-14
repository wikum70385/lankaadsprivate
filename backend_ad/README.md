# LankaAds Backend

This is the backend server for the LankaAds application, handling ad management, user authentication, and related functionality.

## Features

- User authentication (register, login)
- Ad management (create, read, update, delete)
- Category management
- Location management (districts and cities)
- Image handling for ads
- Business rules enforcement (ad limits, edit locks, expiration)

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- PNPM (package manager)

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a PostgreSQL database named `lankaads`

3. Create a `.env` file in the root directory with the following variables:
```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lankaads
DB_PASSWORD=your_password
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_secret_key

# Server Configuration
PORT=3001
```

4. Initialize the database:
```bash
node src/config/init-db.js
```

5. Start the development server:
```bash
pnpm dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Ads
- `GET /api/ads` - Get all ads (with pagination and filters)
- `GET /api/ads/:id` - Get a specific ad
- `POST /api/ads` - Create a new ad
- `PUT /api/ads/:id` - Update an ad
- `DELETE /api/ads/:id` - Delete an ad
- `POST /api/ads/:id/republish` - Republish an expired ad

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug` - Get a specific category

### Locations
- `GET /api/locations/districts` - Get all districts
- `GET /api/locations/cities/:district` - Get cities for a district

## Business Rules

1. **Ad Limits**:
   - Maximum 4 active ads per user
   - Ads expire after 60 days
   - Ads cannot be edited for 14 days after posting

2. **Phone Number Validation**:
   - Must be in Sri Lankan format (+94 or 0 followed by 9 digits)

3. **Image Limitations**:
   - Each ad can have up to 1 image

## Development

- The server uses Express.js for routing
- PostgreSQL for database
- JWT for authentication
- CORS enabled for frontend integration

## Testing

Run tests with:
```bash
pnpm test
``` 