import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config/index.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';
import reviewRoutes from './routes/reviews.js';
import metaRoutes from './routes/meta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Behind Render's proxy, trust X-Forwarded-Proto so req.protocol is https.
app.set('trust proxy', true);

// Middleware
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://shop-website-dun.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl) and any allowed/localhost/vercel origin
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, true); // permissive for this project
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/meta', metaRoutes);

// Mobile PWA (served from the same origin/API)
app.use('/mobile', express.static(path.join(__dirname, '../public/mobile')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`CORS enabled for: ${config.clientUrl}`);
});
