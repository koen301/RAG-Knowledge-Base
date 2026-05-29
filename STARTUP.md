# RAG Knowledge Base - 启动说明

## 项目架构

RAG Knowledge Base 采用**前后端分离架构**：

- **后端**: FastAPI (端口 8000) - 提供 REST API 接口
- **前端**: React + Vite + TypeScript (端口 5173) - Web 用户界面
- **向量数据库**: ChromaDB - 存储文档向量
- **原型界面**: Gradio (端口 7860) - 原型简易界面

## 启动方式

### 方式一：一键启动（推荐）

使用分步启动脚本，可自动安装依赖并同时启动前后端服务：

```bash
# macOS/Linux
./start_advanced.sh

# Windows
bash start_advanced.sh
```

该脚本会依次：
1. 激活虚拟环境并安装 Python 依赖
2. 安装前端依赖
3. 启动后端服务 (FastAPI)
4. 启动前端服务 (React)

### 方式二：快速分步启动

适用于已有依赖已安装的情况：

```bash
# 终端1: 启动后端
cd src
python -m uvicorn api:app --reload --port 8000

# 终端2: 启动前端
cd frontend
npm run dev
```

### 方式三：使用 Gradio 原型界面

如需使用简洁的 Gradio 原型界面，可通过以下方式启动：

```bash
# 终端1: 启动后端
cd src
python app.py
```

浏览器访问 `http://localhost:7860`

## 访问地址

| 服务 | 地址 |
|------|------|
| 前端界面 | http://localhost:5173 |
| 后端 API 文档 | http://localhost:8000/docs |
| Gradio 界面 | http://localhost:7860 |

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `GET /api/status` | GET | 获取系统状态和知识库统计 |
| `GET /api/documents` | GET | 获取已上传文档列表 |
| `POST /api/upload` | POST | 上传文档构建知识库 |
| `POST /api/chat` | POST | 发送对话消息 |
| `POST /api/clear` | POST | 清空对话历史 |

## 配置说明

启动前请确保：

1. **配置 API Key** - 复制 `.env.example` 为 `.env`，填入你的 API Key
2. **准备知识库文档** - 将 PDF/TXT/MD 文档放入 `src/data/` 目录，或通过 Web 界面上传
3. **安装依赖** - 首次运行需安装 Python 和 Node.js 依赖

## 端口说明

如果端口被占用，可通过以下方式修改：

- **后端端口**: 修改 `src/api.py` 中的 `uvicorn` 命令参数 `--port`
- **前端端口**: 修改 `frontend/vite.config.ts` 中的 `server.port`
- **Gradio 端口**: 修改 `src/app.py` 中的 `gradio` 参数

## 内置示例文档

项目在 `src/data/knowledge_base.md` 提供了示例知识库文档，首次启动时会自动加载。
