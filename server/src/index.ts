import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/connection.js';
import companiesRouter from './routes/companies.js';
import pricesRouter from './routes/prices.js';
import searchRouter from './routes/search.js';
import submissionLogRouter from './routes/submissionLog.js';
import editHistoryRouter from './routes/editHistory.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/companies', companiesRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/search', searchRouter);
app.use('/api/submission-logs', submissionLogRouter);
app.use('/api/edit-history', editHistoryRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

