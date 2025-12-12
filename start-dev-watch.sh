#!/bin/bash

# Script para levantar Backend y Frontend mostrando logs en tiempo real
# Uso: ./start-dev-watch.sh

echo "=========================================="
echo "🚀 Iniciando Backend y Frontend"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependencias
echo -e "${BLUE}Verificando dependencias...${NC}"
if ! command_exists dotnet; then
    echo -e "${YELLOW}⚠️  Error: .NET SDK no está instalado${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${YELLOW}⚠️  Error: npm no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencias verificadas${NC}"
echo ""

# ============================================
# BACKEND - Configuración inicial
# ============================================
echo -e "${BLUE}📦 Configurando Backend...${NC}"

cd backend || exit 1

echo -e "${YELLOW}1) Restaurando dependencias...${NC}"
dotnet restore
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Error al restaurar dependencias${NC}"
    exit 1
fi

echo -e "${YELLOW}2) Compilando proyecto...${NC}"
dotnet build
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Error al compilar${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Backend configurado correctamente${NC}"
echo ""

# Volver a la raíz del proyecto
cd .. || exit 1

# Configurar variable de entorno para el backend
export ASPNETCORE_ENVIRONMENT=Development

echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
echo ""
echo -e "${GREEN}Backend:${NC} http://localhost:5193"
echo -e "${GREEN}Swagger:${NC} http://localhost:5193/swagger"
echo -e "${GREEN}Frontend:${NC} http://localhost:5173"
echo ""
echo -e "${YELLOW}Presiona Ctrl+C para detener todos los servicios${NC}"
echo ""

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo -e "${YELLOW}Deteniendo servicios...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓ Servicios detenidos${NC}"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# Iniciar backend en background
cd backend || exit 1
dotnet run &
BACKEND_PID=$!
cd .. || exit 1

# Esperar un momento para que el backend inicie
sleep 3

# Iniciar frontend en background
npm run dev &
FRONTEND_PID=$!

# Esperar a que ambos procesos terminen
wait $BACKEND_PID $FRONTEND_PID



