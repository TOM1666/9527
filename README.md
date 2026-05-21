# MyDate

前后端分离项目

## 目录结构

```
mydate/
├── frontend/          # Vue/React 前端
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/           # FastAPI 后端
│   ├── main.py
│   └── requirements.txt
└── package.json       # 根目录脚本
```

## 快速开始

### 安装依赖

```bash
# 前端
cd frontend && npm install

# 后端
cd backend && pip install -r requirements.txt
```

### 开发模式

```bash
# 同时启动前后端
npm install  # 安装 concurrently
npm run dev

# 或分别启动
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:8000
```

### 生产构建

```bash
npm run build:frontend
npm start
```
