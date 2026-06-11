# 电话亭档案 MVP

全栈电话亭档案管理：React 前端 + Express 后端 + SQLite。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18、Vite、TypeScript、shadcn/ui、Tailwind CSS |
| 状态/表单 | TanStack Query v5、React Hook Form + zod |
| 后端 | Express、TypeScript、better-sqlite3 |
| 数据库 | SQLite `./data/booths.db` |

- 前端端口：**3101**
- 后端端口：**3000**
- 前端通过 Vite proxy 将 `/api` 转发到 `localhost:3000`

## 环境要求

- Node.js 18+（推荐 20 或 22；Node 24 需 better-sqlite3 ≥ 12.x 预编译包）
- 依赖均在项目内 `npm install`，无需全局 pnpm/yarn

## 快速启动

### 方式一：根目录一键启动（推荐）

在仓库根目录执行以下命令，同时启动前后端：

```bash
npm run install:all
npm run dev
```

- 后端运行于：http://localhost:3000
- 前端运行于：http://localhost:3101

其他根目录快捷命令：

```bash
npm run typecheck    # 前后端 TypeScript 类型检查
npm run build        # 前后端构建
```

### 方式二：分别启动

#### 1. 后端（端口 3000）

```bash
cd backend
npm install
npm run dev
```

若 `better-sqlite3` 安装失败（Windows 无预编译包），可安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 后重试，或换用 Node 20/22。

首次启动会自动创建数据库并写入 5 条 seed 数据。

#### 2. 前端（端口 3101）

```bash
cd frontend
npm install
npm run dev
```

浏览器访问：http://localhost:3101

## 功能

- **列表页**：电话亭表格，支持城市 / 状态筛选，新增、删除
- **详情页**：展示经纬度、发现日期、照片；地图区域为 Card 占位；支持编辑、删除

### 字段

| 字段 | 说明 |
|------|------|
| city | 城市 |
| address | 地址 |
| longitude | 经度 |
| latitude | 纬度 |
| status | 状态：`available`（可用）、`damaged`（损坏）、`demolished`（已拆） |
| discovery_date | 发现日期 |
| photo_url | 照片 URL |

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/booths` | 列表（可选 `city`、`status` 查询参数） |
| GET | `/api/booths/cities` | 城市列表 |
| GET | `/api/booths/:id` | 详情 |
| POST | `/api/booths` | 创建 |
| PUT | `/api/booths/:id` | 更新 |
| DELETE | `/api/booths/:id` | 删除 |

## 目录结构

```
├── backend/          # Express API
│   └── src/
├── frontend/         # React 应用
│   └── src/
├── data/             # SQLite 数据库（运行时生成）
└── README.md
```
