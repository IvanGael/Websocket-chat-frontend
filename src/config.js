const config = {
    development: {
        baseURL: "ws://localhost:8080/ws",
    },
    production: {
        baseURL: "https://websocket-chat-backend-aofi.onrender.com/ws",
    },
};

const env = process.env.NODE_ENV || 'development';

export default {
    ...config[env],
    env,
};