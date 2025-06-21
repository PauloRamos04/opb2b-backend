declare namespace NodeJS {
  interface ProcessEnv {
    // Database
    MONGODB_URL: string;
    MONGODB_DB: string;
    
    // JWT Secrets
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    
    // API
    PORT: string;
    NODE_ENV: 'development' | 'production' | 'test';
    CORS_ORIGIN: string;
    
    // Google Sheets
    GOOGLE_SPREADSHEET_ID: string;
    GOOGLE_SHEET_NAME: string;
    GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
    GOOGLE_PRIVATE_KEY: string;
    GOOGLE_SHEETS_CLIENT_EMAIL: string;
    GOOGLE_SHEETS_PRIVATE_KEY: string;
  }
}