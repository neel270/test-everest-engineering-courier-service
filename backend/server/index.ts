import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database';
import { Application } from './core/Application';

// Import routes
import authRoutes from './routes/auth';
import deliveryRoutes from './routes/delivery';
import packageRoutes from './routes/package';
import vehicleRoutes from './routes/vehicle';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize application services
(async () => {
  try {
    await Application.getInstance().initialize();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
})();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
  })
);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Courier Service API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/vehicles", vehicleRoutes);

// 404 handler
app.use("*", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Error:", err);

    // Type-safe error status handling
    const statusCode =
      err &&
      typeof err === "object" &&
      "status" in err &&
      typeof err.status === "number"
        ? err.status
        : 500;

    res.status(statusCode).json({
      success: false,
      message: err instanceof Error ? err.message : "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        stack: err instanceof Error ? err.stack : undefined,
      }),
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Courier Service API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});

export default app;
