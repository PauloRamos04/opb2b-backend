@echo off
echo 🚀 Iniciando build otimizado...

set NODE_OPTIONS=--max-old-space-size=8192

echo 📦 Limpando cache...
npm cache clean --force

echo 📥 Instalando dependências...
if not exist package-lock.json (
    npm install --package-lock-only
)

npm ci --legacy-peer-deps || npm install

echo 🔨 Fazendo build...
npm run build

echo ✅ Build concluído!