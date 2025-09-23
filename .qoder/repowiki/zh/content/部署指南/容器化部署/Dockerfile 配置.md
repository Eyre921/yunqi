# Dockerfile 配置

<cite>
**本文档引用文件**  
- [Docker 容器化部署.md](file://.qoder/repowiki/zh/content/部署与运维/部署策略/Docker 容器化部署.md)
- [package.json](file://package.json)
- [next.config.ts](file://next.config.ts)
- [ecosystem.config.js](file://ecosystem.config.js)
</cite>

## 目录
1. [简介](#简介)
2. [多阶段构建流程详解](#多阶段构建流程详解)
3. [构建指令与上下文分析](#构建指令与上下文分析)
4. [优化策略与最佳实践](#优化策略与最佳实践)
5. [部署与运行时配置](#部署与运行时配置)

## 简介
本文档旨在详细解析“数字化作品互动展示平台”项目中 Docker 容器化部署的核心配置。尽管项目根目录下未直接提供 `Dockerfile`，但通过分析项目文档 `.qoder/repowiki/zh/content/部署与运维/部署策略/Docker 容器化部署.md`，可以完整还原其多阶段构建（multi-stage build）的设计理念与实现过程。该方案结合了 Next.js 框架特性与 PM2 进程管理，实现了高效、安全、轻量化的生产环境部署。

## 多阶段构建流程详解

根据项目文档，该平台采用 Docker 多阶段构建策略，其核心流程分为两个独立阶段，旨在分离构建环境与运行环境，从而优化最终镜像。

### 构建阶段（Builder Stage）
第一阶段作为构建环境，其主要任务是安装项目依赖并执行 Next.js 的静态资源构建。

1.  **基础镜像选择**：使用包含 Node.js 18 或更高版本的官方镜像（如 `node:18-alpine` 或 `node:20`）作为基础。这确保了构建环境具备运行 `npm` 和 `next build` 命令所需的 Node.js 运行时。
2.  **工作目录设置**：通过 `WORKDIR /app` 指令在镜像内创建并切换到 `/app` 目录，作为后续所有操作的根目录。
3.  **依赖安装**：首先，将 `package.json` 和 `package-lock.json` 文件复制到工作目录。随后执行 `RUN npm install` 命令，安装项目所需的所有生产依赖和开发依赖。此步骤是构建过程中最耗时的环节之一。
4.  **源码复制与构建**：将项目源码（`src/` 目录等）复制到工作目录。最后，执行 `RUN npm run build` 命令，触发 Next.js 的构建流程。此命令会根据 `next.config.ts` 的配置，生成优化后的静态文件和服务器端代码，并存放于 `.next` 目录中。

### 运行阶段（Runtime Stage）
第二阶段作为最终的运行环境，其目标是创建一个尽可能轻量、安全的生产镜像。

1.  **轻量基础镜像**：使用更精简的 Node.js 运行时镜像（如 `node:18-alpine`）作为基础。Alpine Linux 镜像体积小，攻击面小，是生产环境的理想选择。
2.  **产物复制**：利用多阶段构建的特性，仅从第一阶段（通常命名为 `builder`）的 `/app` 目录中，将 `package.json`、`package-lock.json` 和构建完成的 `.next` 目录复制到当前阶段的 `/app` 目录。这确保了最终镜像不包含任何源代码、开发工具或开发依赖。
3.  **生产依赖安装**：在运行阶段，执行 `RUN npm install --production` 命令。由于 `package.json` 已被复制，此命令只会安装 `dependencies` 中列出的生产依赖，进一步减小镜像体积。
4.  **端口暴露与启动**：通过 `EXPOSE 3000` 指令声明容器在 3000 端口监听。最后，使用 `CMD ["npm", "start"]` 指令定义容器启动时执行的命令，该命令会启动 Next.js 生产服务器。

**Diagram sources**
- [Docker 容器化部署.md](file://.qoder/repowiki/zh/content/部署与运维/部署策略/Docker 容器化部署.md#L31-L43)
- [package.json](file://package.json#L0-L61)

```mermaid
flowchart TD
subgraph "构建阶段 (Builder)"
A["基础镜像: node:20"] --> B["WORKDIR /app"]
B --> C["COPY package*.json ./"]
C --> D["RUN npm install"]
D --> E["COPY . ."]
E --> F["RUN npm run build"]
F --> G["产出: .next 目录"]
end
subgraph "运行阶段 (Runtime)"
H["基础镜像: node:20-alpine"] --> I["WORKDIR /app"]
I --> J["COPY --from=builder /app/package*.json ./"]
J --> K["COPY --from=builder /app/.next ./.next"]
K --> L["RUN npm install --production"]
L --> M["EXPOSE 3000"]
M --> N["CMD [\"npm\", \"start\"]"]
end
G --> K
```

**Section sources**
- [Docker 容器化部署.md](file://.qoder/repowiki/zh/content/部署与运维/部署策略/Docker 容器化部署.md#L31-L43)
- [package.json](file://package.json#L0-L61)

## 构建指令与上下文分析

### 核心指令作用解析
- **`WORKDIR`**: 设置工作目录，为后续的 `COPY`、`RUN` 等指令提供一个基准路径，确保文件操作的相对性。
- **`COPY`**: 将主机（构建上下文）的文件或目录复制到镜像中。在多阶段构建中，`COPY --from=<stage>` 语法允许从一个构建阶段复制文件到另一个阶段。
- **`RUN`**: 在镜像中执行命令。在构建阶段用于安装依赖和构建应用，在运行阶段用于安装生产依赖。
- **`CMD`**: 定义容器启动时执行的默认命令。`["npm", "start"]` 会调用 `package.json` 中定义的 `start` 脚本，启动 Next.js 服务。
- **`EXPOSE`**: 声明容器监听的端口，是 Docker 的一种元数据，便于在运行时进行端口映射。

### 构建上下文路径
构建上下文（Build Context）指的是执行 `docker build` 命令时，发送到 Docker 守护进程的文件和目录的集合。对于本项目，构建上下文应为项目根目录（``）。在此目录下，Dockerfile 会引用 `package.json`、`src/` 目录、`next.config.ts` 等文件。尽管项目中未找到 `.dockerignore` 文件，但最佳实践强烈建议创建它，以排除 `node_modules`、`.git`、`logs` 等非必要文件，从而显著加快构建速度。

**Section sources**
- [Docker 容器化部署.md](file://.qoder/repowiki/zh/content/部署与运维/部署策略/Docker 容器化部署.md#L31-L43)
- [package.json](file://package.json#L0-L61)

## 优化策略与最佳实践

### 缓存优化
通过将 `COPY package*.json ./` 放在 `COPY . .` 之前，巧妙地利用了 Docker 的层缓存机制。只要 `package.json` 或 `package-lock.json` 文件内容不变，Docker 就会复用 `npm install` 步骤的缓存层。这意味着当仅修改源代码时，无需重新下载和安装庞大的依赖包，极大地提升了构建效率。

### 安全加固
- **非 root 用户运行**：最佳实践要求在运行阶段创建一个非 root 用户（例如 `node` 用户），并通过 `USER node` 指令切换到该用户来运行应用。这遵循了最小权限原则，即使容器被攻破，攻击者也无法获得 root 权限，从而限制了损害范围。
- **依赖最小化**：多阶段构建本身就是一个安全最佳实践。最终镜像不包含 `npm`、`git` 等构建工具和开发依赖，减少了潜在的攻击面。

### 性能与配置优化
- **Next.js 配置**：`next.config.ts` 文件中的配置对构建产物有直接影响。例如，`experimental.isrMemoryCacheSize` 设置了增量静态再生的内存缓存大小，`compiler.removeConsole` 在生产环境中移除了 `console.log` 语句，这些都优化了最终应用的性能。
- **PM2 集成**：虽然 Dockerfile 使用 `npm start` 启动，但 `ecosystem.config.js` 提供了更高级的进程管理能力。在生产部署中，可以在运行阶段安装 PM2 并使用 `pm2 start` 代替 `npm start`，以实现集群模式、自动重启和性能监控。

**Section sources**
- [Docker 容器化部署.md](file://.qoder/repowiki/zh/content/部署与运维/部署策略/Docker 容器化部署.md#L31-L43)
- [next.config.ts](file://next.config.ts#L0-L102)
- [ecosystem.config.js](file://ecosystem.config.js#L0-L127)

## 部署与运行时配置

### 环境变量管理
生产环境的配置（如数据库连接、OSS 密钥、NextAuth 密钥）应通过环境变量注入，而非硬编码在代码或 Dockerfile 中。这可以通过 Docker Compose 的 `environment` 字段或 Kubernetes 的 `ConfigMap`/`Secret` 来实现。`ecosystem.config.js` 中的 `env` 配置展示了如何为 PM2 应用设置环境变量。

### 反向代理与 HTTPS
在生产环境中，通常不会直接暴露 Docker 容器的 3000 端口。而是使用 Nginx 或 Traefik 作为反向代理，部署在应用容器之前。反向代理负责处理 HTTPS 加密、SSL 证书管理、负载均衡和静态资源缓存，而应用容器只需处理内部的 HTTP 请求。

### CI/CD 集成
`ecosystem.config.js` 中的 `deploy` 配置提供了一个 CI/CD 流水线的蓝图。自动化流程可以包括：代码推送 -> 自动测试 -> 构建 Docker 镜像 -> 推送镜像到仓库 -> 在服务器上拉取新镜像并执行 `post-deploy` 脚本（`npm install && npm run build && pm2 reload`），从而实现无缝的滚动更新。

**Section sources**
- [ecosystem.config.js](file://ecosystem.config.js#L0-L127)