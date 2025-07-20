# EassyEvent Backend

A Node.js/Express backend API for the EassyEvent venue booking application.

## Features

- **User Authentication**: JWT-based authentication system
- **Email Verification**: Account verification via email
- **Password Reset**: Secure password reset functionality
- **Rate Limiting**: API rate limiting for security
- **Input Validation**: Comprehensive input validation
- **Security**: CORS, Helmet, and other security middleware
- **MongoDB**: Database with Mongoose ODM

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration:

   ```
   MONGODB_URI=mongodb://localhost:27017/eassyevent
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start MongoDB**

   - Local: `mongod`
   - Or use MongoDB Atlas cloud service

5. **Run the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "1234567890",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "pinCode": "123456",
  "city": "Mumbai",
  "state": "Maharashtra"
}
```

#### Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Verify Email

```http
GET /api/auth/verify-email/:token
```

#### Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password

```http
POST /api/auth/reset-password/:token
Content-Type: application/json

{
  "password": "newSecurePassword123"
}
```

#### Get User Profile

```http
GET /api/auth/profile
Authorization: Bearer <jwt-token>
```

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── errorHandler.js     # Global error handling
│   └── validation.js       # Request validation
├── models/
│   └── User.js             # User schema
├── routes/
│   └── auth.js             # Authentication routes
├── utils/
│   ├── generateToken.js    # JWT token generation
│   └── sendEmail.js        # Email service
├── .env.example            # Environment variables template
├── package.json
└── server.js               # Main server file
```

## Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication in your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASS`

### Other Email Providers

Update the SMTP settings in `.env`:

```
# For Outlook/Hotmail
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587

# For Yahoo
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
```

## Security Features

- **Password Hashing**: bcryptjs with salt
- **JWT Tokens**: Secure authentication
- **Rate Limiting**: Prevents spam and brute force
- **Input Validation**: express-validator
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **Environment Variables**: Sensitive data protection

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## Rate Limiting

- **Registration**: 5 attempts per 15 minutes per IP
- **Login**: 5 attempts per 15 minutes per IP
- **Password Reset**: 3 attempts per 15 minutes per IP

## Database Schema

### User Model

```javascript
{
  name: String (required),
  email: String (required, unique),
  mobile: String (required),
  password: String (required, hashed),
  pinCode: String (required),
  city: String (required),
  state: String (required),
  isEmailVerified: Boolean (default: false),
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Development

### Running in Development Mode

```bash
npm run dev  # Uses nodemon for auto-restart
```

### Testing the API

Use tools like Postman, Insomnia, or curl to test the endpoints.

Example with curl:

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "1234567890",
    "password": "securePassword123",
    "confirmPassword": "securePassword123",
    "pinCode": "123456",
    "city": "Mumbai",
    "state": "Maharashtra"
  }'
```

## Deployment

### Local Deployment

1. Ensure MongoDB is running
2. Set NODE_ENV=production in .env
3. Run `npm start`

### Production Deployment (Heroku example)

1. Install Heroku CLI
2. Create a new app: `heroku create eassyevent-api`
3. Set environment variables: `heroku config:set MONGODB_URI=...`
4. Deploy: `git push heroku main`

### Environment Variables for Production

```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=your-production-secret
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASS=your-app-password
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
