de# 🚚 Kiki's Courier Service

A modern courier service cost calculator with offer code support, featuring both a web interface and command-line tool for calculating delivery costs, discounts, and estimated delivery times.

## ✨ Features

- **Smart Cost Calculation**: Automatic calculation of delivery costs based on weight, distance, and base delivery cost
- **Offer Code System**: Support for multiple discount codes with specific criteria (OFR001, OFR002, OFR003)
- **Vehicle Optimization**: Intelligent package-to-vehicle assignment for optimal delivery scheduling
- **Real-time Delivery Time Estimation**: Calculate estimated delivery times based on vehicle speed and distance
- **Dual Interface**: Both web-based GUI and command-line interface for different use cases
- **Responsive Design**: Modern, mobile-friendly web interface built with React and Tailwind CSS

## 🛠️ Technology Stack

### Frontend:
- **Framework**: React 18, TypeScript, Vite
- **UI Components**: shadcn-ui, Radix UI, Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom animations

### Backend:
- **Runtime**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Custom middleware
- **Logging**: Morgan
- **Password Hashing**: bcryptjs

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or bun package manager

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to access the web interface.

## 🖥️ Backend API

The application includes a Node.js/Express backend with MongoDB integration.

### Backend Features:
- **RESTful API** for courier calculations
- **User authentication** with JWT
- **Data persistence** for delivery history
- **MongoDB integration** for data storage
- **Rate limiting** and security middleware

### Starting the Backend:

```bash
# Development mode with auto-restart
npm run server:dev

# Production mode
npm run server

# Build backend (if needed)
npm run build:server
```

### API Endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/delivery/calculate` - Calculate delivery costs
- `GET /api/delivery/history` - Get delivery history
- `GET /api/packages` - Manage packages
- `GET /api/vehicles` - Manage vehicles

### Database:
The application uses MongoDB for data persistence. Make sure MongoDB is running locally or update the `MONGODB_URI` in your `.env` file for MongoDB Atlas.

## 💻 Usage

### Web Interface

1. **Configure Vehicle Settings**:
  - Set base delivery cost
  - Configure number of vehicles
  - Set maximum speed and weight capacity

2. **Add Packages**:
  - Click "Add Package" to create new package entries
  - Enter package ID, weight (kg), distance (km), and offer code
  - Use offer codes: `OFR001`, `OFR002`, or `OFR003`

3. **Calculate Costs**:
  - Click "Calculate Delivery Costs" to get results
  - View detailed breakdown of costs, discounts, and delivery times

### Command Line Interface

The application includes a CLI tool for batch processing and automation.

#### Build the CLI
```bash
npm run build:cli
```

#### Interactive Mode
```bash
npm run cli
```

#### Process from File
```bash
npm run cli input.txt output.txt
```

#### Input Format
```
base_delivery_cost no_of_packages
pkg_id1 pkg_weight1_in_kg distance1_in_km offer_code1
pkg_id2 pkg_weight2_in_kg distance2_in_km offer_code2
...
no_of_vehicles max_speed max_carriable_weight
```

#### Example Input
```
100 3
PKG1 5 5 OFR001
PKG2 15 5 OFR002
PKG3 10 100 OFR003
2 70 200
```

#### Output Format
```
pkg_id1 discount1 total_cost1 estimated_delivery_time1
pkg_id2 discount2 total_cost2 estimated_delivery_time2
...
```

## 📊 Offer Codes

| Code | Discount | Distance Range | Weight Range | Description |
|------|----------|----------------|--------------|-------------|
| OFR001 | 10% | 0-200 km | 70-200 kg | Standard long-distance discount |
| OFR002 | 7% | 50-150 km | 100-250 kg | Medium-distance package discount |
| OFR003 | 5% | 50-250 km | 10-150 kg | Lightweight package discount |

## 🏗️ Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components (shadcn)
│   │   ├── CourierCalculator.tsx    # Main calculator component
│   │   ├── DeliveryResults.tsx     # Results display component
│   │   ├── PackageList.tsx         # Package management component
│   │   ├── VehicleConfiguration.tsx # Vehicle settings component
│   │   └── OfferCodesReference.tsx  # Offer codes reference
│   ├── lib/
│   │   └── delivery-service.ts     # Core business logic
│   ├── cli/
│   │   └── delivery-cli.ts         # CLI implementation
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   └── assets/             # Static assets
├── public/                 # Public assets
└── package.json           # Dependencies and scripts
```

## 🔧 API Reference

### DeliveryService Class

The core service class that handles all delivery calculations.

#### Constructor
```typescript
const deliveryService = new DeliveryService(baseDeliveryCost: number);
```

#### Methods

- `calculateCost(package: PackageData)`: Calculate cost for a single package
- `validateOfferCode(package: PackageData)`: Validate if offer code applies
- `calculateAllDeliveryResults(packages: PackageData[], vehicles: Vehicle[])`: Process multiple packages
- `optimizePackageShipments(packages: PackageData[], vehicles: Vehicle[])`: Optimize vehicle assignments

#### Data Types

```typescript
interface PackageData {
 id: string;
 weight: number;
 distance: number;
 offerCode: string;
}

interface Vehicle {
 id: number;
 maxSpeed: number;
 maxCarriableWeight: number;
 availableTime: number;
}

interface DeliveryResult {
 id: string;
 discount: number;
 totalCost: number;
 originalCost: number;
 estimatedDeliveryTime: number;
}
```

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run build:cli` - Build CLI tool
- `npm run cli` - Run CLI tool
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Quality

This project uses ESLint for code quality checks. Run `npm run lint` to check for issues.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for efficient courier cost calculation**
