# 🚚 Everest Engineering Courier Service

A comprehensive, full-stack courier service management system built with modern web technologies. This enterprise-grade application provides complete delivery lifecycle management, from package creation to delivery tracking, with intelligent cost calculation, vehicle optimization, and user authentication.

## ✨ Key Features

### 🚛 Core Management System
- **Complete Delivery Lifecycle**: From package creation to final delivery tracking
- **Intelligent Cost Calculation**: Automated pricing based on weight, distance, and dynamic factors
- **Vehicle Fleet Management**: Comprehensive vehicle tracking and optimization
- **Package Management**: Full CRUD operations for package handling
- **User Management**: Role-based access control and authentication

### 💰 Advanced Pricing Engine
- **Dynamic Cost Calculation**: Real-time pricing based on multiple factors
- **Offer Code System**: Flexible discount system with customizable rules
- **Bulk Processing**: Efficient handling of multiple packages simultaneously
- **Cost Optimization**: Intelligent routing and vehicle assignment

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based user authentication
- **Role-Based Access Control**: Granular permissions for different user types
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Input Validation**: Comprehensive data validation and sanitization

### 📊 Analytics & Reporting
- **Delivery Analytics**: Comprehensive reporting and insights
- **Performance Metrics**: Track delivery times, costs, and efficiency
- **Real-time Monitoring**: Live tracking of delivery operations
- **Historical Data**: Complete audit trail of all operations

## 🛠️ Technology Stack

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom animations and themes
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router DOM with protected routes
- **Form Handling**: React Hook Form with Zod validation
- **Charts & Visualization**: Recharts for data visualization
- **Icons**: Lucide React icon library

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM for data modeling
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs hashing
- **Security**: Helmet for security headers, CORS configuration
- **Rate Limiting**: Express rate limiting middleware
- **Logging**: Morgan for HTTP request logging
- **Validation**: Custom middleware for input validation
- **Development**: Nodemon for auto-restart during development

### Development & Quality
- **TypeScript**: Full type safety across frontend and backend
- **ESLint**: Code quality and consistency enforcement
- **Monorepo**: Workspace-based architecture for better organization
- **Testing**: Comprehensive test utilities and database testing

## 📋 System Requirements

- **Node.js**: Version 16 or higher
- **npm**: Version 7 or higher (or yarn/pnpm)
- **MongoDB**: Version 4.4 or higher (local installation or MongoDB Atlas)
- **Git**: For version control and cloning the repository

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd test-everest-engineering-courier-service
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
npm install --workspace=frontend

# Install backend dependencies
npm install --workspace=backend
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your configuration
nano .env  # or your preferred editor
```

**Required Environment Variables:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/courier_service

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Setup
```bash
# Ensure MongoDB is running locally, or use MongoDB Atlas
# For local MongoDB installation, start the service:
sudo systemctl start mongod  # Linux
# or
brew services start mongodb/brew/mongodb-community  # macOS
```

### 5. Start the Application
```bash
# Development mode (both frontend and backend)
npm run dev

# Or start services individually:
npm run dev:frontend  # Frontend only
npm run dev:backend    # Backend only
```

### 6. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs (if enabled)

## 🖥️ Backend API Reference

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Delivery Management
- `GET /api/deliveries` - List all deliveries
- `POST /api/deliveries` - Create new delivery
- `GET /api/deliveries/:id` - Get delivery details
- `PUT /api/deliveries/:id` - Update delivery
- `DELETE /api/deliveries/:id` - Delete delivery
- `POST /api/deliveries/calculate` - Calculate delivery costs
- `GET /api/deliveries/history` - Get delivery history

### Package Management
- `GET /api/packages` - List all packages
- `POST /api/packages` - Create new package
- `GET /api/packages/:id` - Get package details
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package
- `GET /api/packages/track/:trackingId` - Track package status

### Vehicle Management
- `GET /api/vehicles` - List all vehicles
- `POST /api/vehicles` - Add new vehicle
- `GET /api/vehicles/:id` - Get vehicle details
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Remove vehicle
- `GET /api/vehicles/available` - Get available vehicles

### User Management
- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 💻 Frontend Features

### Dashboard & Navigation
- **Responsive Dashboard**: Modern, mobile-friendly interface
- **Navigation System**: Intuitive routing with protected routes
- **Theme Support**: Light/dark theme switching
- **Real-time Notifications**: Toast notifications for user feedback

### Delivery Management Interface
- **Delivery List View**: Comprehensive delivery tracking
- **Delivery Details**: Detailed view with status tracking
- **Delivery Filters**: Advanced filtering and search capabilities
- **Delivery Timeline**: Visual timeline of delivery progress

### Package Management Interface
- **Package Creation**: User-friendly package creation forms
- **Package Tracking**: Real-time package status updates
- **Bulk Operations**: Efficient handling of multiple packages
- **Package History**: Complete audit trail

### Vehicle Management Interface
- **Vehicle Fleet Overview**: Complete fleet management dashboard
- **Vehicle Assignment**: Intelligent vehicle-to-package assignment
- **Vehicle Tracking**: Real-time vehicle location and status
- **Maintenance Scheduling**: Vehicle maintenance tracking

### Cost Calculation Interface
- **Interactive Calculator**: Real-time cost calculation
- **Offer Code Integration**: Seamless discount application
- **Cost Breakdown**: Detailed cost analysis and breakdown
- **Bulk Processing**: Efficient multi-package processing

## 📊 Offer Code System

The system supports flexible offer codes with customizable rules:

| Code | Discount | Distance Range | Weight Range | Description |
|------|----------|----------------|--------------|-------------|
| OFR001 | 10% | 0-200 km | 70-200 kg | Standard long-distance discount |
| OFR002 | 7% | 50-150 km | 100-250 kg | Medium-distance package discount |
| OFR003 | 5% | 50-250 km | 10-150 kg | Lightweight package discount |
| OFR004 | 15% | 0-100 km | 50-150 kg | Short-distance premium discount |
| OFR005 | 12% | 100-250 km | 100-200 kg | Long-distance standard discount |

## 🏗️ Project Architecture

```
test-everest-engineering-courier-service/
├── 📁 backend/                          # Backend application
│   ├── 📁 server/                       # Server implementation
│   │   ├── 📁 config/                   # Configuration files
│   │   │   └── database.ts              # Database configuration
│   │   ├── 📁 controllers/              # Route controllers
│   │   │   ├── DeliveryController.ts    # Delivery logic
│   │   │   ├── PackageController.ts     # Package logic
│   │   │   ├── UserController.ts        # User logic
│   │   │   └── VehicleController.ts     # Vehicle logic
│   │   ├── 📁 lib/                      # Core libraries
│   │   │   └── delivery-service.ts      # Business logic
│   │   ├── 📁 middleware/               # Express middleware
│   │   │   └── auth.ts                  # Authentication middleware
│   │   ├── 📁 models/                   # Database models
│   │   │   ├── Delivery.ts              # Delivery model
│   │   │   ├── Package.ts               # Package model
│   │   │   ├── User.ts                  # User model
│   │   │   └── Vehicle.ts               # Vehicle model
│   │   ├── 📁 routes/                   # API routes
│   │   │   ├── auth.ts                  # Auth routes
│   │   │   ├── delivery.ts              # Delivery routes
│   │   │   ├── package.ts               # Package routes
│   │   │   └── vehicle.ts               # Vehicle routes
│   │   ├── 📁 services/                 # Business services
│   │   │   ├── DeliveryService.ts       # Delivery service
│   │   │   ├── PackageService.ts        # Package service
│   │   │   ├── UserService.ts           # User service
│   │   │   └── VehicleService.ts        # Vehicle service
│   │   ├── 📁 types/                    # TypeScript types
│   │   │   ├── api.ts                   # API types
│   │   │   ├── delivery.ts              # Delivery types
│   │   │   ├── package.ts               # Package types
│   │   │   ├── user.ts                  # User types
│   │   │   └── vehicle.ts               # Vehicle types
│   │   └── 📁 utils/                    # Utility functions
│   │       ├── test-db.ts               # Database testing
│   │       └── test-server.ts           # Server testing
│   ├── 📁 package.json                  # Backend dependencies
│   └── 📁 tsconfig.json                 # TypeScript config
│
├── 📁 frontend/                         # Frontend application
│   ├── 📁 public/                       # Static assets
│   │   ├── favicon.ico                  # Site favicon
│   │   └── assets/                      # Public assets
│   ├── 📁 src/                          # Source code
│   │   ├── 📁 assets/                   # Static assets
│   │   ├── 📁 components/               # React components
│   │   │   ├── 📁 auth/                 # Authentication components
│   │   │   ├── 📁 ui/                   # UI components
│   │   │   └── [component files]        # Feature components
│   │   ├── 📁 hooks/                    # Custom React hooks
│   │   ├── 📁 lib/                      # Utility libraries
│   │   ├── 📁 pages/                    # Page components
│   │   ├── 📁 types/                    # TypeScript types
│   │   └── 📁 cli/                      # CLI components
│   ├── 📁 package.json                  # Frontend dependencies
│   └── 📁 vite.config.ts                # Vite configuration
│
├── 📁 .env.example                      # Environment template
├── 📁 package.json                      # Root dependencies
└── 📁 README.md                         # This file
```

## 🔧 Development Scripts

### Root Level Scripts
```bash
npm run dev              # Start both frontend and backend
npm run build            # Build both frontend and backend
npm run lint             # Lint both frontend and backend
npm run test             # Run tests for both workspaces
```

### Frontend Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run build:dev        # Build in development mode
npm run lint             # Run ESLint
npm run preview          # Preview production build
```

### Backend Scripts
```bash
npm run dev              # Start with nodemon (auto-restart)
npm run start            # Start production server
npm run build            # Compile TypeScript
npm run lint             # Lint TypeScript files
npm run test-db          # Test database connection
```

## 🧪 Testing

### Database Testing
```bash
# Test database connection
npm run test-db --workspace=backend
```

### API Testing
The application includes comprehensive API testing utilities in the backend utils directory.

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Secure cross-origin resource sharing
- **Helmet Security**: Security headers for HTTP responses
- **Input Validation**: Comprehensive input sanitization
- **Role-Based Access**: Granular permission system

## 📈 Performance Features

- **Optimized Queries**: Efficient database queries with indexing
- **Caching Strategy**: Intelligent caching for frequently accessed data
- **Lazy Loading**: Components and data loaded on demand
- **Code Splitting**: Optimized bundle sizes for faster loading
- **Database Indexing**: Optimized database performance

## 🤝 Contributing

1. **Fork the Repository**: Create your own fork of the project
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Implement your feature or bug fix
4. **Run Tests**: Ensure all tests pass
5. **Commit Changes**: `git commit -m 'Add amazing feature'`
6. **Push Branch**: `git push origin feature/amazing-feature`
7. **Create Pull Request**: Submit your changes for review

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure code passes all linting checks
- Follow the existing code style and patterns

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Documentation

### Getting Help
- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Documentation**: Comprehensive API documentation available in-code

### Resources
- **API Documentation**: Available at `/api-docs` when running the server
- **Component Documentation**: Available in component files
- **Type Definitions**: Comprehensive TypeScript definitions throughout

## 🏆 Acknowledgments

Built with modern web technologies and best practices for enterprise-grade courier service management.

---

**Everest Engineering Courier Service** - Comprehensive delivery management for the modern enterprise.
