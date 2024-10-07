const config = {
    development: {
        baseURL: "ws://localhost:8080",
        baseURL2: "http://localhost:8080"
    },
    production: {
        baseURL: "https://websocket-chat-backend-aofi.onrender.com",
        baseURL2: "https://websocket-chat-backend-aofi.onrender.com"
    },
};

const env = process.env.NODE_ENV || 'development';

export default {
    ...config[env],
    env,
};