const Binance = require("node-binance-api");
const redis = require("redis");

// Redis client setup
const client = redis.createClient("//redis:6379");
client.auth("YzRAdGgkF25g");
client.on('error', (err) => console.error('Redis error:', err));

// Binance instance
let binance = null;
let userDataWs = null;
let reconnectTimer = null;

async function initializeBinance() {
    try {
        // Retrieve credentials from Redis
        const [binancekey, binancesecret] = await Promise.all([
            new Promise((resolve) => client.get("global_settings:binance_api_key", (err, reply) => resolve(reply))),
            new Promise((resolve) => client.get("global_settings:binance_api_secret", (err, reply) => resolve(reply)))
        ]);

        if (!binancekey || !binancesecret || binancekey === 'false' || binancesecret === 'false') {
            throw new Error("Invalid Binance API credentials");
        }

        // Initialize Binance instance
        binance = new Binance().options({
            APIKEY: binancekey,
            APISECRET: binancesecret,
            reconnect: true,
            family: 4,
            verbose: true,
        });

        return binance;
    } catch (error) {
        console.error("Binance initialization failed:", error.message);
        return null;
    }
}

function handleExecutionReport(data) {
    console.log('Execution Report:', data);
    
    const { s: symbol, i: orderId, X: orderStatus, x: executionType, L: price, q: quantity, S: side, o: orderType, r: rejectReason, n: commission } = data;

    if (executionType === "NEW") {
        if (orderStatus === "REJECTED") {
            console.log(`Order Failed! Reason: ${rejectReason}`);
        }
        console.log(`${symbol} ${side} ${orderType} ORDER #${orderId} (${orderStatus})`);
    }

    // Store order data in Redis
    const redisKey = `orders-status:${symbol}:${orderId}`;
    const pipeline = client.multi();
    
    pipeline.set(`${redisKey}`, orderStatus);
    pipeline.set(`${redisKey}-price`, price);
    
    if (orderStatus === "PARTIALLY_FILLED") {
        pipeline.expire(`${redisKey}`, 10000);
        pipeline.expire(`${redisKey}-price`, 10000);
    } else if (orderStatus === "FILLED" || orderStatus === "CANCELED") {
        pipeline.set(`${redisKey}-comsa`, commission);
        pipeline.set(`${redisKey}-side`, side);
        pipeline.set(`${redisKey}-quantity`, quantity);
        pipeline.expire(`${redisKey}`, 5);
        pipeline.expire(`${redisKey}-price`, 5);
        pipeline.expire(`${redisKey}-comsa`, 5);
        pipeline.expire(`${redisKey}-side`, 5);
        pipeline.expire(`${redisKey}-quantity`, 5);
    }

    pipeline.exec((err) => {
        if (err) console.error('Redis error:', err);
    });
}

async function startUserDataStream() {
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
                return;
            }
        }

        // Start user data stream
        userDataWs = binance.websockets.userData(
            (data) => {
                if (data.e === 'executionReport') {
                    handleExecutionReport(data);
                }
                // Ignore other events like outboundAccountPosition
            },
            true // combined stream
        );

        console.log("User data WebSocket started");

    } catch (error) {
        console.error("Error starting user data stream:", error);
        scheduleReconnect();
    }
}

function scheduleReconnect() {
    // Clear any existing timer
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }

    // Schedule reconnect after 30 seconds
    reconnectTimer = setTimeout(() => {
        console.log("Attempting to reconnect...");
        startUserDataStream();
    }, 30000);
}

// Handle process termination
process.on('SIGINT', () => {
    console.log("Shutting down gracefully...");
    
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }
    
    if (userDataWs && binance) {
        binance.websockets.terminate(userDataWs);
    }
    
    client.quit();
    process.exit();
});

// Start the stream
startUserDataStream();

// Optional: Add a keep-alive check every hour
setInterval(() => {
    if (!userDataWs) {
        console.log("WebSocket appears disconnected, reconnecting...");
        startUserDataStream();
    }
}, 3600000); // 1 hour