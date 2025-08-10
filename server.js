const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorHandlerMiddleware = require('./middleware/errorHandlerMiddleware');
const trimmer = require('./utils/trimmer');

dotenv.config();

const { connectRedis } = require('./config/redisClient');

const allowedOrigins = [
  'http://localhost:5173',
  'http://192.168.29.114:5173',
  'http://localhost:5174',
  'http://192.168.29.114:5174',
];

// We will import routes after Redis connects
async function startServer() {
  try {
    await connectRedis();
    console.log('✅ Redis connected');

    const app = express();

    app.use(morgan('dev'));
    app.use(helmet());
    app.use(cookieParser());
    app.use(express.json());

    app.use(cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }));

    // Import routes after Redis connection to avoid issues with Redis clients in middleware
    const authRoute = require('./route/authRoute');
    const otpRoute = require('./route/otpRoutes');

    app.use('/auth', authRoute);
    app.use('/otp', otpRoute);

    app.use(trimmer);
    app.use(errorHandlerMiddleware);
    app.use(notFoundMiddleware);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://<your-local-ip>:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
