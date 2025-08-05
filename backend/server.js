import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import cron from "node-cron";

// Routes
import authRoutes from "./routes/auth.Route.js";
// import userRoutes from "./routes/userRoutes.js";
// import leadRoutes from "./routes/leadRoutes.js";
// import taskRoutes from "./routes/taskRoutes.js";
// import aiRoutes from "./routes/aiRoutes.js";
// import competitorRoutes from "./routes/competitorRoutes.js";

// Import middleware
// import { errorHandler } from "./middlewares/errorHandler.js";
// import { notFound } from "./middlewares/notFound.js";

// Import utilities

import { resetMonthlyUsage } from "./utils/subscription.Utils.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth routes
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
//app.use("/api/", limiter);
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/", generalLimiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://localhost:3000", // for testing
      "http://127.0.0.1:5173",
    ];

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: "10mb", type: "application/json" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Routes
app.use("/api/auth", authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/leads', leadRoutes);
// app.use('/api/tasks', taskRoutes);
// app.use('/api/ai', aiRoutes);
// app.use('/api/competitors', competitorRoutes);

// Health check
// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime()
//   });
// });

// Error handling
// app.use(notFound);
// app.use(errorHandler);

// API documentation endpoint
// app.get("/api", (req, res) => {
//   res.json({
//     success: true,
//     message: "AI-Powered CRM API",
//     version: "1.0.0",
//     endpoints: {
//       auth: "/api/auth",
//       health: "/api/health",
// users: '/api/users',
// leads: '/api/leads',
// tasks: '/api/tasks',
// ai: '/api/ai',
// competitors: '/api/competitors'
//     },
//     documentation: "Visit /api/docs for detailed API documentation",
//   });
// });

// Socket.IO for real-time updates
// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

// Join user-specific room for notifications
//   socket.on('join-user-room', (userId) => {
//     socket.join(`user-${userId}`);
//     console.log(`User ${userId} joined their room`);
//   });

// Join team rooms for managers
//   socket.on('join-team-room', (teamId) => {
//     socket.join(`team-${teamId}`);
//     console.log(`User joined team room: ${teamId}`);
//   });

// Handle lead status updates
//   socket.on('lead-status-update', (data) => {
// Broadcast to team members
//     socket.to(`team-${data.teamId}`).emit('lead-updated', data);
//   });

// Handle AI insights generated
//   socket.on('ai-insight-generated', (data) => {
//     socket.to(`user-${data.userId}`).emit('new-ai-insight', data);
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// Make io available globally for other modules
//app.set('io', io);

// Error handling middleware (should be last)
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

// Cron job to reset monthly usage (runs on 1st of every month at 00:00)
cron.schedule(
  "0 0 1 * *",
  async () => {
    console.log("Running monthly usage reset...");
    await resetMonthlyUsage();
  },
  {
    timezone: "UTC",
  }
);

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
    mongoose.connection.close();
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated");
    mongoose.connection.close();
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log("Unhandled Promise Rejection:", err.message);
  server.close(() => {
    process.exit(1);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
