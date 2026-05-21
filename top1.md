# Top1 - 项目操作总结

## 一、环境搭建

### 1. Node.js 安装
- 使用 `winget install OpenJS.NodeJS.LTS` 安装 Node.js v24.15.0
- npm 版本: 11.12.1

### 2. Python 安装
- 用户手动安装 Python 3.12.6
- 路径: `D:\Python312\`
- 需勾选 "Add Python to PATH"

### 3. 依赖安装
```bash
# 前端
cd frontend && npm install

# 后端
cd backend && pip install -r requirements.txt
# 包含: fastapi, uvicorn, httpx
```

## 二、目录结构调整

```
mydate/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── main.jsx       # React 入口
│   │   ├── App.jsx        # 主组件
│   │   ├── App.css        # 组件样式
│   │   └── index.css      # 全局样式
│   ├── index.html         # HTML 入口
│   ├── package.json       # 前端依赖
│   └── vite.config.js     # Vite 配置 (含 API 代理)
├── backend/               # FastAPI 后端
│   ├── main.py            # 后端主文件
│   └── requirements.txt   # Python 依赖
├── docs/
│   └── weather_flow.md    # 天气模块流程图
├── package.json           # 根目录启动脚本
└── README.md              # 项目说明
```

## 三、前端开发 (React)

### 1. HTML → React 转换
- 将原生 `index.html` 转换为 React 单文件组件
- 使用 `useState`, `useEffect`, `useRef` 管理状态
- 保留原有功能：个人信息、任务列表、图库、设置面板

### 2. 天气组件
- **位置**: 页面右上角 (header 内绝对定位)
- **样式**: 毛玻璃效果 (`backdrop-filter: blur`)
- **显示内容**: 天气图标、温度、天气状况、湿度、风力、体感温度
- **透明度控制**: 设置面板中可调节 20%-100%
- **数据源**: 通过 Vite 代理请求后端 `/api/xc/weather`

### 3. Vite 代理配置
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

## 四、后端开发 (FastAPI)

### 1. 基础配置
- CORS 中间件 (允许所有来源)
- 静态文件服务 (生产环境提供前端 dist)
- SPA 路由支持

### 2. API 接口

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/like` | 获取点赞数 |
| POST | `/api/like` | 点赞/取消 (like: 1=点赞, 2=取消) |
| GET | `/api/xc/weather` | 许昌天气数据 |

### 3. 天气代理实现
```python
@app.get("/api/xc/weather")
async def get_weather():
    url = "https://n34t2cr7um.re.qweatherapi.com/v7/weather/now"
    headers = {"X-QW-Api-Key": "ac0e95f272924155a2aad5667c1704d7"}
    params = {"location": "113.82,34.05", "lang": "zh-hans", "unit": "m"}
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        return response.json()
```

## 五、启动命令

```bash
# 同时启动前后端
npm run dev

# 单独启动
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:8000

# 生产构建
npm run build:frontend
npm start              # 后端 + 静态前端
```

## 六、关键修复记录

1. **重复 style 属性** - 图库卡片 JSX 中有两个 style，合并为一个
2. **后端 401 错误** - 和风 API 需添加 `X-QW-Api-Key` 请求头
3. **代理连接拒绝** - 后端未启动导致前端 proxy 报错，需确保后端运行
4. **端口占用** - 重启服务前先 `Stop-Process` 杀掉旧进程

## 七、天气模块流程

详见 `docs/weather_flow.md`，包含：
- 数据请求时序图
- 组件交互流程
- 设置面板控制流
- 目录结构说明
