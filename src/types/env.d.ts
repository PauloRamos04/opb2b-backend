declare global {
    namespace NodeJS {
      interface ProcessEnv {
        GOOGLE_SPREADSHEET_ID: string;
        GOOGLE_SHEET_NAME: string;
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
        GOOGLE_PRIVATE_KEY: string;
        JWT_SECRET: string;
        PORT?: string;
      }
    }
  }
  
  export {};