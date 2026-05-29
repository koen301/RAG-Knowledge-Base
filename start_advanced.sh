#!/bin/bash

# RAG Knowledge Base 启动脚本

echo "========================================="
echo "  RAG 智能知识库 - 启动脚本"
echo "========================================="

# 激活虚拟环境并安装 Python 依赖
echo "[1/4] 安装 Python 依赖..."
source .venv/Scripts/activate
pip install -r requirements.txt

# 安装前端依赖
echo "[2/4] 安装前端依赖..."
cd frontend
npm install
cd ..

# 启动后端服务
echo "[3/4] 启动后端服务 (FastAPI)..."
cd src
python -m uvicorn api:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端服务
echo "[4/4] 启动前端服务 (React)..."
cd frontend
npm run dev

# 清理
kill $BACKEND_PID
