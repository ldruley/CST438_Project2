// frontend/CST438_Project2/config/api.js

const API_CONFIG = {
    // Set this to false for production, true for development
    DEV_MODE: false,

    // Base URLs
    DEV_URL: 'http://localhost:8080',
    PROD_URL: 'https://cst-438-tierlist-11c4c83a6934.herokuapp.com',

    // Getter for the base URL based on mode
    get BASE_URL() {
        return this.DEV_MODE ? this.DEV_URL : this.PROD_URL;
    }
};

export default API_CONFIG;