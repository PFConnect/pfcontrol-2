import pg from 'pg';
import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const { Pool } = pg;

const chatsPool = new Pool({
    connectionString: process.env.POSTGRES_DB_URL_CHATS,
    ssl: {
        rejectUnauthorized: false,
        require: true
    }
});

(async () => {
    try {
        await chatsPool.query('SELECT 1');
        console.log('\x1b[34m%s\x1b[0m', 'Chats DB connected');
    } catch (err) {
        console.error('Error connecting to Chats DB:', err);
    }
})();

export default chatsPool;