const Binance = require("node-binance-api");
const redis = require("redis");

// Redis client setup with error handling
const client = redis.createClient({ url: "//redis:6379" });
client.auth("YzRAdGgkF25g");
client.on('error', (err) => console.error('Redis error:', err));
client.on('connect', () => console.log('Redis connected'));

// Binance instance and state management
let binance = null;
let userDataWs = null;
let reconnectTimer = null;
let isRunning = false;

async function initializeBinance() {
    try {
        // Retrieve credentials from Redis using pipeline for efficiency
        const [binancekey, binancesecret] = await Promise.all([
            new Promise((resolve) => client.get("global_settings:binance_api_key", (err, reply) => 
                resolve(err ? null : reply))),
            new Promise((resolve) => client.get("global_settings:binance_api_secret", (err, reply) => 
                resolve(err ? null : reply)))
        ]);

        if (!binancekey || !binancesecret || binancekey === 'false' || binancesecret === 'false') {
            throw new Error("Invalid Binance API credentials");
        }

        // Initialize Binance with better options
        return new Binance().options({
            APIKEY: binancekey,
            APISECRET: binancesecret,
            reconnect: true,  // Enable built-in reconnection
            family: 4,
            verbose: false,    // Disable verbose logging
            log: (log) => {    // Custom logging
                if (log.level === 'error') console.error('Binance error:', log.message);
            }
        });
    } catch (error) {
        console.error("Binance initialization failed:", error.message);
        return null;
    }
}

function handleBalanceUpdate(data) {
    if (!data.B) return;

    const pipeline = client.multi();
    data.B.forEach(({ a: asset, f: available, l: onOrder }) => {
        console.log(`${asset}\tavailable: ${available}\ton order: ${onOrder}`);
        
        pipeline.set(`balances:${asset}-available`, available);
        pipeline.set(`balances:${asset}-onOrder`, onOrder);
        pipeline.expire(`balances:${asset}-available`, 30000);  // 30 seconds TTL
        pipeline.expire(`balances:${asset}-onOrder`, 30000);
    });

    pipeline.exec((err) => {
        if (err) console.error('Redis pipeline error:', err);
    });
}

async function startUserDataStream() {
    if (isRunning) return;
    isRunning = true;

    try {
        // Clear previous connection if exists
        if (userDataWs) {
            binance.websockets.terminate(userDataWs);
            userDataWs = null;
        }

        // Initialize Binance if not already done
        if (!binance) {
            binance = await initializeBinance();
            if (!binance) {
                console.error("Cannot start user data stream - Binance not initialized");
                scheduleReconnect();
                return;
            }
        }

        console.log("Starting user data WebSocket...");
        userDataWs = binance.websockets.userData(
            (data) => {
                if (data.e === 'outboundAccountPosition') {
                    handleBalanceUpdate(data);
                }
                // Add other event handlers here if needed
            },
            true // combined stream
        );

        // Monitor WebSocket health
        setTimeout(() => {
            if (!binance.websockets.subscriptions()[userDataWs]) {
                console.warn("WebSocket connection failed, reconnecting...");
                scheduleReconnect();
            }
        }, 5000);

    } catch (error) {
        console.error("Error in user data stream:", error);
        scheduleReconnect();
    } finally {
        isRunning = false;
    }
}

function scheduleReconnect() {
    // Clear any existing timer
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }

    // Schedule reconnect with backoff
    const delay = 30000; // 30 seconds
    console.log(`Scheduling reconnect in ${delay/1000} seconds...`);
    
    reconnectTimer = setTimeout(() => {
        console.log("Attempting to reconnect...");
        startUserDataStream();
    }, delay);
}

// Handle process termination gracefully
function shutdown() {
    console.log("Shutting down gracefully...");
    
    clearInterval(healthCheckInterval);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    
    if (binance && userDataWs) {
        try {
            binance.websockets.terminate(userDataWs);
        } catch (e) {
            console.error("Error terminating WebSocket:", e);
        }
    }
    
    client.quit(() => process.exit());
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Health check every 5 minutes
const healthCheckInterval = setInterval(() => {
    if (!userDataWs || !binance?.websockets?.subscriptions()[userDataWs]) {
        console.log("WebSocket appears disconnected, reconnecting...");
        startUserDataStream();
    }
}, 300000); // 5 minutes

// Start the service
startUserDataStream();