import app from './app.js';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT || 3001;

// Cliente Supabase (usa anon key para queries seguras, service para admin)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!  // Usa service key en backend
);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
