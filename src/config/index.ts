export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'seu-jwt-secret-super-seguro',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'seu-refresh-secret-super-seguro',
    expiresIn: '8h',
    refreshExpiresIn: '7d',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/operacoes_b2b',
    database: process.env.MONGODB_DB || 'operacoes_b2b',
  },
  googleSheets: {
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    sheetName: process.env.GOOGLE_SHEET_NAME || 'HOJE',
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
};