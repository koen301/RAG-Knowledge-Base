import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Status {
  status: string
  vector_count: number
  message: string
}

interface Document {
  name: string
  size: number
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>({ status: 'loading', vector_count: 0, message: '' })
  const [documents, setDocuments] = useState<Document[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [uploadStatus, setUploadStatus] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStatus()
    fetchDocuments()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status')
      const data = await res.json()
      setStatus(data)
    } catch (e) {
      setStatus({ status: 'error', vector_count: 0, message: '无法连接服务器' })
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('请先选择文件')
      return
    }

    setUploadStatus('上传中...')
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setUploadStatus(data.message)
        fetchStatus()
        fetchDocuments()
        setFiles([])
      } else {
        setUploadStatus(data.detail || '上传失败')
      }
    } catch (e) {
      setUploadStatus('上传失败: ' + String(e))
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })
      const data = await res.json()

      if (data.answer) {
        let content = data.answer
        if (data.sources && data.sources.length > 0) {
          content += '\n\n**参考来源：**\n' + data.sources.map((s: string) => '- ' + s).join('\n')
        }
        setMessages(prev => [...prev, { role: 'assistant', content }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '错误: ' + String(e) }])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    await fetch('/api/clear', { method: 'POST' })
    setMessages([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🤖 RAG 智能知识库</h1>
        <p>基于 FastAPI + React + LangChain + ChromaDB + OpenAI Embedding</p>
      </header>

      <main className="main">
        <aside className="sidebar">
          <div className="panel">
            <h3>📁 文档管理</h3>
            <div className="upload-area">
              <input
                type="file"
                id="file-input"
                multiple
                accept=".pdf,.txt,.md,.py,.js"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-input" className="upload-btn">
                {files.length > 0 ? `已选择 ${files.length} 个文件` : '选择文件'}
              </label>
              {files.length > 0 && (
                <ul className="file-list">
                  {files.map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              )}
              <button onClick={handleUpload} className="build-btn">
                🔨 构建知识库
              </button>
              {uploadStatus && <p className="status-text">{uploadStatus}</p>}
            </div>
          </div>

          <div className="panel">
            <h3>📋 已加载文档</h3>
            <div className="doc-list">
              {documents.length === 0 ? (
                <p className="empty-text">暂无文档</p>
              ) : (
                <ul>
                  {documents.map((doc, i) => (
                    <li key={i}>
                      <span className="doc-icon">📄</span>
                      <span className="doc-name">{doc.name}</span>
                      <span className="doc-size">{formatFileSize(doc.size)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={fetchDocuments} className="refresh-btn">
              🔄 刷新
            </button>
          </div>

          <div className="panel">
            <h3>⚙️ 系统状态</h3>
            <div className="status-info">
              <span className={`status-badge ${status.status}`}>
                {status.status === 'ready' ? '✅ 已就绪' : status.status === 'loading' ? '⏳ 加载中' : '⚠️ 未就绪'}
              </span>
              {status.vector_count > 0 && (
                <p>向量片段: {status.vector_count}</p>
              )}
              <p className="status-message">{status.message}</p>
            </div>
          </div>

          <button onClick={handleClear} className="clear-btn">
            🗑️ 清空对话
          </button>
        </aside>

        <section className="chat-area">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="welcome">
                <p>👋 欢迎使用 RAG 智能知识库</p>
                <p>请先上传文档构建知识库，然后开始对话</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '🧑' : '🤖'}
                  </div>
                  <div className="message-content">
                    {msg.content.split('\n').map((line, j) => (
                      <p key={j}>{line}</p>
                    ))}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <p className="loading">思考中...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入问题，例如：这份文档主要讲了什么？"
              disabled={loading || status.status !== 'ready'}
            />
            <button
              onClick={handleSend}
              disabled={loading || status.status !== 'ready' || !input.trim()}
              className="send-btn"
            >
              🚀 发送
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
