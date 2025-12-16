import dotenv from 'dotenv';

// Load environment variables BEFORE importing app
// This ensures env vars are available when passport.ts loads
dotenv.config();

import app from './app';

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
	console.log(`[server] listening on http://localhost:${port}`);
});
