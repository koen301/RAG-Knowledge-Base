"""
RAG Knowledge Base API
基于 FastAPI 的 RAG 知识库后端服务
"""
import os
import glob
import shutil
import asyncio
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_engine import RAGEngine
from config import Config

app = FastAPI(title="RAG Knowledge Base API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = RAGEngine()
engine_initialized = False


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]


@app.get("/")
async def root():
    return {"message": "RAG Knowledge Base API", "version": "1.0.0"}


@app.get("/api/status")
async def get_status():
    """获取系统状态"""
    try:
        if engine.load_existing_store():
            engine.create_qa_chain()
            vector_count = len(engine.vector_store.get()['ids'])
            return {
                "status": "ready",
                "vector_count": vector_count,
                "message": "已加载现有知识库"
            }
    except Exception:
        pass
    return {
        "status": "not_ready",
        "vector_count": 0,
        "message": "尚未构建知识库"
    }


@app.get("/api/documents")
async def list_documents():
    """列出已加载的文档"""
    docs = glob.glob(os.path.join(Config.DATA_DIR, "*"))
    if not docs:
        return {"documents": []}
    
    documents = [
        {"name": os.path.basename(d), "size": os.path.getsize(d)}
        for d in docs
    ]
    return {"documents": documents}


@app.post("/api/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    """上传文档并构建知识库"""
    if not files:
        raise HTTPException(status_code=400, detail="请先上传文件")
    
    os.makedirs(Config.DATA_DIR, exist_ok=True)
    saved_files = []
    
    try:
        for file in files:
            file_path = os.path.join(Config.DATA_DIR, file.filename)
            
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            saved_files.append(file_path)
        
        documents = engine.load_documents(saved_files)
        if not documents:
            raise HTTPException(status_code=400, detail="未能加载任何文档")
        
        engine.build_vector_store(documents)
        engine.create_qa_chain()
        
        vector_count = len(engine.vector_store.get()['ids'])
        
        return {
            "success": True,
            "document_count": len(documents),
            "vector_count": vector_count,
            "message": f"成功加载 {len(documents)} 页文档，构建 {vector_count} 个向量片段"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """对话接口"""
    if not engine.qa_chain:
        raise HTTPException(status_code=400, detail="请先上传文档构建知识库")
    
    try:
        result = engine.chat(request.message)
        return ChatResponse(
            answer=result["answer"],
            sources=result.get("sources", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/clear")
async def clear_history():
    """清空对话历史"""
    engine.clear_memory()
    return {"success": True, "message": "对话历史已清空"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
