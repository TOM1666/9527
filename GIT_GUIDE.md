# Git 使用指南

## 项目结构
```
mydate/
├── backend/      # 后端代码
├── frontend/     # 前端代码
├── docs/         # 项目文档
└── .gitignore    # Git 忽略配置
```

## 快速开始

### 1. 初始化仓库
```bash
cd E:\projects\mydate
git init
```

### 2. 配置用户信息
```bash
git config user.name "你的名字"
git config user.email "你的邮箱"
```

### 3. 添加文件并提交
```bash
git add .
git commit -m "Initial commit"
```

## 常用命令

### 查看状态
```bash
git status          # 查看工作区状态
git log             # 查看提交历史
git log --oneline   # 简洁查看提交历史
```

### 分支管理
```bash
git branch          # 查看本地分支
git branch -a       # 查看所有分支（含远程）
git branch <name>   # 创建新分支
git checkout <name> # 切换分支
git checkout -b <name> # 创建并切换分支
git merge <name>    # 合并分支到当前分支
git branch -d <name>    # 删除分支
```

### 远程仓库
```bash
git remote add origin <url>   # 添加远程仓库
git push -u origin main       # 推送到远程
git pull origin main          # 拉取远程更新
git clone <url>               # 克隆仓库
```

### 撤销操作
```bash
git restore <file>        # 撤销工作区修改
git restore --staged <file> # 取消暂存
git reset --soft HEAD~1   # 撤销上次提交（保留更改）
git reset --hard HEAD~1   # 撤销上次提交（丢弃更改）
```

## 分支策略

### 推荐工作流
- `main` - 主分支，保持稳定可发布状态
- `develop` - 开发分支，集成最新功能
- `feature/*` - 功能分支，开发新功能
- `bugfix/*` - 修复分支，修复 bug
- `release/*` - 发布分支，准备发布

### 开发流程
```bash
# 1. 从 develop 创建功能分支
git checkout develop
git checkout -b feature/user-auth

# 2. 开发完成后合并回 develop
git checkout develop
git merge feature/user-auth

# 3. 准备发布
git checkout -b release/v1.0.0
# 测试、修复问题
git checkout main
git merge release/v1.0.0
git tag v1.0.0
```

## 提交规范

### Commit Message 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例
```bash
git commit -m "feat(user): add login functionality"
git commit -m "fix(api): resolve timeout issue"
git commit -m "docs(readme): update installation guide"
```

## 注意事项

1. **提交前检查**：确保 `.gitignore` 已正确配置，避免提交敏感文件或大文件
2. **频繁提交**：小步提交，便于回溯和代码审查
3. **推送前拉取**：`git pull` 后再 `git push`，避免冲突
4. **保护主分支**：生产环境分支应设置保护规则
5. **定期清理**：删除已合并的分支，保持仓库整洁

## 常见问题

### 解决冲突
```bash
git pull origin main
# 手动解决冲突文件
git add <resolved-files>
git commit -m "resolve merge conflicts"
```

### 暂存更改
```bash
git stash           # 暂存当前修改
git stash list      # 查看暂存列表
git stash pop       # 恢复并删除暂存
git stash apply     # 恢复但保留暂存
```

### 查看差异
```bash
git diff            # 工作区与暂存区差异
git diff --staged   # 暂存区与上次提交差异
git diff main..develop # 分支间差异
```
