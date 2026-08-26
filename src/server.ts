import { createApp } from './app';
import { env } from './config/env';

const app = createApp();
const PORT = env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT} [${env.NODE_ENV}]`);
});

