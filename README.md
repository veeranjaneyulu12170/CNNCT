# CNNCT - Meeting & Event Scheduling Platform

A modern web application for scheduling and managing meetings and events. Built with React, Node.js, Express, and MongoDB.
LINK: https://cnnct-1.onrender.com 

## Features

- User authentication (signup/login)
- Event creation and management
- Availability scheduling
- Conflict detection
- Participant management
- Mobile-responsive design
- Calendar view
- Availability view

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form
- Zod (validation)

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt (password hashing)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd cnnct-scheduler
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
```

4. Create a `.env` file in the server directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cnnct-scheduler
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

5. Start MongoDB:
```bash
mongod
```

6. Start the backend server:
```bash
cd server
npm run dev
```

7. Start the frontend development server:
```bash
# In a new terminal
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Create an account or log in
3. Set your availability
4. Create and manage events
5. Share event links with participants

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get user profile
- PUT `/api/auth/profile` - Update user profile

### Events
- POST `/api/events` - Create a new event
- GET `/api/events` - Get all events
- GET `/api/events/:id` - Get event by ID
- PUT `/api/events/:id` - Update event
- DELETE `/api/events/:id` - Delete event
- POST `/api/events/:id/join` - Join event
- PUT `/api/events/:id/participants/:userId` - Update participant status

### Availability
- GET `/api/availability` - Get user's availability
- POST `/api/availability` - Set availability
- PUT `/api/availability/:id` - Update availability
- DELETE `/api/availability/:id` - Delete availability
- GET `/api/availability/slots/:date` - Get available time slots

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
