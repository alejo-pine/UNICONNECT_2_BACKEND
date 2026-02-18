import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));  // Ajusta para prod
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend UniConnect OK' });
});

export default app;
