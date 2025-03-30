const Binance = require("node-binance-api");
const redis = require("redis");

// Redis client setup with improved configuration
const client = redis.createClient({
    url: "//redis:6379",
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis server refused connection');
            return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) { // 1 hour
            return new Error('Retry time exhausted');
        }
        return Math.min(options.attempt * 100, 5000); // Exponential backoff
    }
});

client.auth("YzRAdGgkF25g");
client.on('error', (err) => console.error('Redis error:', err));
client.on('connect', () => console.log('Redis connected successfully'));

// State management
let binanceInstance = null;
let activeSubscriptions = new Set();
let isInitializing = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

async function initializeBinance() {
    if (isInitializing) return null;
    isInitializing = true;

    try {
        // Use pipeline for multiple Redis requests
        const [binancekey, binancesecret] = await new Promise((resolve, reject) => {
            client.multi()
                .get("global_settings:binance_api_key")
                .get("global_settings:binance_api_secret")
                .exec((err, replies) => {
                    if (err) reject(err);
                    else resolve([replies[0][1], replies[1][1]]);
                });
        });

        if (!binancekey || !binancesecret || binancekey === 'false' || binancesecret === 'false') {
            throw new Error("Invalid Binance API credentials");
        }

        binanceInstance = new Binance().options({
            APIKEY: binancekey,
            APISECRET: binancesecret,
            reconnect: true,
            family: 4,
            verbose: false,
            log: (log) => {
                if (log.level === 'error') console.error('Binance error:', log.message);
            }
        });

        reconnectAttempts = 0; // Reset on successful initialization
        return binanceInstance;
    } catch (error) {
        console.error("Binance initialization failed:", error.message);
        return null;
    } finally {
        isInitializing = false;
    }
}

async function updatePriceSubscriptions() {
    if (!binanceInstance) {
        binanceInstance = await initializeBinance();
        if (!binanceInstance) {
            console.error("Cannot update subscriptions - Binance not initialized");
            return;
        }
    }

    try {
        const startTime = Date.now();
        const monetlistraw = await new Promise((resolve) => {
            client.get("monetlist", (err, reply) => {
                if (err) {
                    console.error("Redis error fetching monetlist:", err);
                    resolve(null);
                } else {
                    resolve(reply);
                }
            });
        });

        if (!monetlistraw) {
            console.warn("No monetlist found in Redis");
            return;
        }

        const monetlist = JSON.parse(monetlistraw);
        
        // Terminate old subscriptions that are no longer needed
        activeSubscriptions.forEach(symbol => {
            if (!monetlist.includes(symbol)) {
                binanceInstance.websockets.terminate(symbol);
                activeSubscriptions.delete(symbol);
            }
        });

        // Add new subscriptions
        monetlist.forEach(symbol => {
            if (!activeSubscriptions.has(symbol)) {
                binanceInstance.websockets.trades(symbol, (trades) => {
                    const { s: symbol, p: price } = trades;
                    client.set(`prices:${symbol}`, price, 'EX', 30); // 30s TTL
                });
                activeSubscriptions.add(symbol);
            }
        });

       

    } catch (error) {
        console.error("Error in updatePriceSubscriptions:", error);
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(updatePriceSubscriptions, 5000 * reconnectAttempts); // Backoff
        } else {
            console.error("Max reconnect attempts reached");
        }
    }
}

// Health check and maintenance
setInterval(() => {
    if (activeSubscriptions.size === 0) {
        console.log("No active subscriptions, attempting to refresh...");
        updatePriceSubscriptions();
    }
}, 60000); // 1 minute

// Graceful shutdown
function shutdown() {
    console.log("Shutting down gracefully...");
    
    // Clean up all subscriptions
    activeSubscriptions.forEach(symbol => {
        try {
            binanceInstance?.websockets?.terminate(symbol);
        } catch (e) {
            console.error(`Error terminating subscription for ${symbol}:`, e);
        }
    });
    
    client.quit(() => {
        console.log("Redis client disconnected");
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the service with initial delay to allow Redis connection
setTimeout(() => {
    updatePriceSubscriptions();
    // Run every 10 seconds but with proper error handling
    setInterval(updatePriceSubscriptions, 10000);
}, 2000);