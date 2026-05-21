# 用户"记住我"功能开发计划

## 一、需求描述

用户在注册或登录时勾选"记住我"选项后，即使关闭浏览器或刷新页面，下次访问时仍保持登录状态，无需重新输入账号密码。

---

## 二、技术方案

### 2.1 核心思路

采用 **双 Token 机制**（Access Token + Refresh Token）：

| Token 类型 | 有效期 | 用途 | 存储位置 |
|---|---|---|---|
| Access Token | 24 小时 | 日常 API 请求认证 | localStorage |
| Refresh Token | 30 天 | 刷新 Access Token | localStorage |

### 2.2 工作流程

```
用户登录（勾选"记住我"）
    │
    ├─ 后端返回：access_token (24h) + refresh_token (30d)
    │
    ├─ 前端保存两个 token 到 localStorage
    │
    │
24 小时后 Access Token 过期
    │
    ├─ 前端检测到 401 错误
    │
    ├─ 调用 POST /api/auth/refresh 传入 refresh_token
    │
    ├─ 后端验证 refresh_token，返回新的 access_token
    │
    └─ 前端用新 token 继续请求
    │
    │
30 天后 Refresh Token 也过期
    │
    └─ 用户需要重新登录
```

---

## 三、后端开发

### 3.1 新增依赖

```
无新增依赖，使用已有的 python-jose
```

### 3.2 修改文件

#### `backend/auth.py`

新增函数：

```python
def create_refresh_token(data: dict):
    """创建 30 天有效期的 Refresh Token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_refresh_token(token: str):
    """验证 Refresh Token，检查 type 字段"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None
```

#### `backend/auth_routes.py`

新增路由：

```python
@router.post("/refresh")
async def refresh_token(req: TokenRefreshRequest):
    """使用 Refresh Token 获取新的 Access Token"""
    payload = decode_refresh_token(req.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    new_access_token = create_access_token(data={"sub": user_id})
    return {"access_token": new_access_token, "token_type": "bearer"}
```

新增模型（`schemas.py`）：

```python
class TokenRefreshRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
```

#### `backend/main.py`

修改 `/api/auth/login` 响应：
- 勾选"记住我"时：返回 `access_token` + `refresh_token`
- 未勾选时：仅返回 `access_token`

### 3.3 新增 API

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|---|---|---|---|---|
| `POST` | `/api/auth/refresh` | 刷新 Access Token | `{refresh_token}` | `{access_token, token_type}` |
| `POST` | `/api/auth/logout` | 注销（可选，清除服务端状态） | - | `{message}` |

### 3.4 登录 API 变更

**请求体新增字段：**

```json
{
  "username": "string",
  "password": "string",
  "remember_me": false  // 新增，默认 false
}
```

**响应变更：**

```json
// 勾选 remember_me = true
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}

// 未勾选 remember_me = false
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

---

## 四、前端开发

### 4.1 修改文件

#### `frontend/src/LoginPage.jsx`

- 新增"记住我"复选框
- 登录时将 `remember_me` 参数传给后端

#### `frontend/src/authService.js`

新增函数：

```javascript
async function refreshToken(refreshToken) {
  const res = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
  if (!res.ok) throw new Error('Refresh failed')
  return res.json()
}

function getRefreshToken() {
  return localStorage.getItem('refresh_token')
}

function setRefreshToken(token) {
  localStorage.setItem('refresh_token', token)
}

function removeRefreshToken() {
  localStorage.removeItem('refresh_token')
}
```

#### `frontend/src/AuthContext.jsx`

修改逻辑：

1. 页面加载时：
   - 先尝试用 `access_token` 调用 `/api/auth/me`
   - 如果 401，检查是否有 `refresh_token`
   - 有则调用 `/api/auth/refresh` 获取新 `access_token`
   - 刷新成功则自动登录，失败则清除所有 token

2. 登录时：
   - 保存 `access_token` 和 `refresh_token`（如果返回了）

3. 退出时：
   - 清除 `access_token` 和 `refresh_token`

#### `frontend/src/taskService.js` / `profileService.js` / `galleryService.js`

所有 API 调用函数增加：
- 检测 401 响应
- 自动调用 refresh token 流程
- 重试原请求

---

## 五、数据库变更

### 5.1 方案选择

| 方案 | 说明 | 是否需要改数据库 |
|---|---|---|
| 无状态 JWT | Refresh Token 也是 JWT，不存数据库 | 否 |
| 有状态 Refresh Token | 数据库中存储 refresh token 记录，可主动撤销 | 是 |

**推荐方案：无状态 JWT**

理由：
- 实现简单，无需额外数据库表
- 适合个人项目规模
- 30 天过期后自动失效

### 5.2 可选扩展（未来）

如需支持"远程注销设备"功能，可新增表：

```sql
CREATE TABLE refresh_tokens (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token_hash VARCHAR(255),
    expires_at DATETIME,
    revoked BOOLEAN DEFAULT FALSE
);
```

---

## 六、开发步骤

### Phase 1: 后端实现（约 1 小时）

1. 修改 `auth.py` 添加 refresh token 创建/验证函数
2. 修改 `schemas.py` 添加新模型
3. 修改 `auth_routes.py` 添加 `/refresh` 路由
4. 修改登录 API 支持 `remember_me` 参数
5. 测试 refresh token 流程

### Phase 2: 前端实现（约 1.5 小时）

1. 修改 `authService.js` 添加 refresh token 管理
2. 修改 `AuthContext.jsx` 添加自动刷新逻辑
3. 修改 `LoginPage.jsx` 添加"记住我"复选框
4. 修改所有 service 文件添加 401 自动重试
5. 测试完整流程

### Phase 3: 联调测试（约 0.5 小时）

1. 测试登录勾选"记住我"
2. 测试 Access Token 过期后自动刷新
3. 测试 Refresh Token 过期后跳转登录页
4. 测试退出登录清除所有 token

---

## 七、安全考虑

| 风险 | 措施 |
|---|---|
| Refresh Token 泄露 | 30 天自动过期，可配合设备指纹验证 |
| Token 重放攻击 | JWT 包含 exp 声明，过期自动失效 |
| XSS 攻击 | 后续可改为 httpOnly cookie 存储 |
| 并发刷新 | 同一 refresh_token 可多次使用（无状态方案） |

---

## 八、测试用例

| 编号 | 场景 | 预期结果 |
|---|---|---|
| T1 | 登录勾选"记住我" | 返回 access_token + refresh_token |
| T2 | 登录不勾选"记住我" | 仅返回 access_token |
| T3 | Access Token 过期，有 refresh_token | 自动刷新，无感知继续操作 |
| T4 | Refresh Token 也过期 | 跳转登录页 |
| T5 | 退出登录 | 清除所有 token |
| T6 | 刷新页面 | 自动验证 token，保持登录状态 |
| T7 | 无效 refresh_token | 返回 401，清除 token |

---

## 九、文件变更清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `backend/auth.py` | 修改 | 新增 refresh token 函数 |
| `backend/schemas.py` | 修改 | 新增 TokenRefreshRequest 模型 |
| `backend/auth_routes.py` | 修改 | 新增 /refresh 路由，修改登录逻辑 |
| `frontend/src/authService.js` | 修改 | 新增 refresh token 管理 |
| `frontend/src/AuthContext.jsx` | 修改 | 新增自动刷新逻辑 |
| `frontend/src/LoginPage.jsx` | 修改 | 新增"记住我"复选框 |
| `frontend/src/taskService.js` | 修改 | 新增 401 重试 |
| `frontend/src/profileService.js` | 修改 | 新增 401 重试 |
| `frontend/src/galleryService.js` | 修改 | 新增 401 重试 |
