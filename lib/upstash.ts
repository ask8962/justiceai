import { Client } from '@upstash/qstash';

// Initialize the Upstash QStash client using environment variables
export const qstashClient = new Client({
    token: process.env.QSTASH_TOKEN || '',
});
