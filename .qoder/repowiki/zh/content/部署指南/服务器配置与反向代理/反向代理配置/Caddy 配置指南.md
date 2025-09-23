# Caddy 配置指南

<cite>
**本文档引用的文件**  
- [next.config.ts](file://next.config.ts)
- [ecosystem.config.js](file://ecosystem.config.js)
</cite>

## 目录
1. [简介](#简介)
2. [Caddy 核心优势](#caddy-核心优势)
3. [Caddyfile 配置示例](#caddyfile-配置示例)
4. [与 Next.js 配置的协同](#与-nextjs-配置的协同)
5. [常见问题及解决方案](#常见问题及解决方案)
6. [总结](#总结)

## 简介

Caddy 是一款现代化的开源 Web 服务器，以其自动化 HTTPS、简洁的声明式配置和强大的反向代理能力著称。在本项目中，Caddy 被用于部署基于 Next.js 的数字化作品互动展示平台，通过简单的 Caddyfile 配置即可实现 HTTPS 自动化、反向代理、缓存控制、Gzip 压缩和安全头注入等功能，极大简化了运维流程并提升了应用安全性。

本指南将详细介绍如何为本项目的 Next.js 应用配置 Caddy，突出其自动化与简洁性优势，并提供完整的配置示例和常见问题解决方案。

**Section sources**
- [next.config.ts](file://next.config.ts#L0-L102)

## Caddy 核心优势

Caddy 相较于传统 Web 服务器（如 Nginx）具有以下显著优势：

- **自动化 HTTPS**：Caddy 默认从 Let's Encrypt 自动申请并续期 SSL 证书，无需手动配置证书路径或续期脚本。
- **声明式语法**：Caddyfile 使用简洁易读的声明式语法，配置直观，学习成本低。
- **内置反向代理**：原生支持反向代理功能，可轻松将请求转发至本地运行的 Next.js 服务（如 `localhost:3000`）。
- **自动 Gzip 压缩**：默认启用 Gzip 压缩，减少传输体积，提升页面加载速度。
- **灵活的头部控制**：通过 `header` 指令可轻松添加、修改或删除 HTTP 响应头，实现缓存控制、CORS 配置和安全加固。
- **零停机重载**：支持配置热重载，修改 Caddyfile 后可平滑更新，不影响正在运行的服务。

这些特性使得 Caddy 成为部署现代 Web 应用的理想选择，尤其适合本项目中使用 PM2 集群模式运行的 Next.js 服务。

**Section sources**
- [ecosystem.config.js](file://ecosystem.config.js#L0-L127)

## Caddyfile 配置示例

以下是一个适用于本项目的完整 Caddyfile 配置示例：

```
yunqi.nfeyre.top {
    # 启用压缩
    encode zstd gzip

    # 反向代理到本地 Next.js 服务
    reverse_proxy localhost:3000

    # 静态资源缓存控制
    @static path /_next/static/* /_next/image*
    header @static Cache-Control "public, max-age=31536000, immutable"

    # API 路由缓存与安全头
    @api path /api/*
    header @api {
        Cache-Control "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
        Access-Control-Allow-Origin "https://yunqi.nfeyre.top"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }

    # 图片资源缓存
    @images path /images/*
    header @images Cache-Control "public, max-age=2592000"

    # 其他页面缓存
    @pages path /((?!api|_next/static|_next/image|favicon.ico).*)
    header @pages Cache-Control "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
}
```

### 配置说明

- **域名绑定**：`yunqi.nfeyre.top` 为服务绑定的域名，Caddy 将自动为其申请 HTTPS 证书。
- **Gzip 压缩**：`encode zstd gzip` 启用 Zstd 和 Gzip 压缩算法。
- **反向代理**：`reverse_proxy localhost:3000` 将所有请求代理至运行在 `localhost:3000` 的 Next.js 服务。
- **缓存控制**：
  - 静态资源（`/_next/static/*`）设置为一年缓存且不可变。
  - 图片资源（`/images/*`）缓存 30 天。
  - 页面内容采用 `stale-while-revalidate` 策略，提升首屏加载速度。
- **安全与 CORS**：
  - 为 API 路由注入 CORS 头，允许指定来源访问。
  - 添加 `X-Frame-Options`、`X-Content-Type-Options` 和 `Strict-Transport-Security` 等安全头，提升应用安全性。

该配置与 `next.config.ts` 中的 `headers` 配置相辅相成，共同实现精细化的缓存与安全策略。

**Section sources**
- [next.config.ts](file://next.config.ts#L45-L102)
- [ecosystem.config.js](file://ecosystem.config.js#L0-L127)

## 与 Next.js 配置的协同

Caddy 的反向代理配置需与 `next.config.ts` 中的 `assetPrefix` 配置协同工作，以确保在 CDN 或子路径部署时资源能正确加载。

在本项目中，`next.config.ts` 虽未显式设置 `assetPrefix`，但其 `headers` 配置已对 `/api`、`/_next/static` 等路径进行了精细化控制。当与 Caddy 配合时，建议在生产环境中设置 `assetPrefix` 以指向 CDN 地址，例如：

```ts
const nextConfig = {
  assetPrefix: 'https://cdn.yunqi.nfeyre.top',
  // ... 其他配置
};
```

此时，Caddy 可配置为将 `/cdn/*` 路径代理至 CDN 源站，或直接通过 `reverse_proxy` 将静态资源请求转发至 CDN，实现动静分离与性能优化。

此外，Caddy 处理 HTTPS 和反向代理后，Next.js 应用无需关心 SSL 终止，可专注于业务逻辑，同时通过 `X-Forwarded-*` 头获取原始请求信息。

**Section sources**
- [next.config.ts](file://next.config.ts#L0-L102)

## 常见问题及解决方案

### 1. 证书申请失败

**现象**：Caddy 启动时报错 `acme: error` 或 `could not obtain certificates`。

**原因**：
- 域名未正确解析到服务器 IP。
- 服务器 80/443 端口被防火墙或安全组阻止。
- Let's Encrypt 的速率限制被触发。

**解决方案**：
- 确认域名 A 记录已正确指向服务器公网 IP。
- 检查服务器防火墙（如 `ufw`、`iptables`）和云服务商安全组，确保 80 和 443 端口开放。
- 使用 `caddy validate` 检查配置文件语法。
- 若为测试环境，可使用 `acme_ca https://acme-staging-v02.api.letsencrypt.org/directory` 切换到 Let's Encrypt 测试环境。

### 2. 代理连接被拒绝

**现象**：访问网站返回 502 Bad Gateway。

**原因**：
- Next.js 服务未启动或未监听 `localhost:3000`。
- PM2 进程异常退出。
- 端口被占用或防火墙阻止本地回环通信。

**解决方案**：
- 检查 Next.js 服务状态：`pm2 status yunqi-platform`。
- 查看应用日志：`pm2 logs yunqi-platform`，排查启动错误。
- 确认 `ecosystem.config.js` 中 `PORT` 配置为 `3000`，且服务正常监听。
- 使用 `curl http://localhost:3000` 测试本地服务连通性。

### 3. 中间件路由冲突

**现象**：部分 API 或页面路由无法访问，返回 404 或被错误代理。

**原因**：
- Caddyfile 中的路由匹配规则与 Next.js 的 `middleware.ts` 或动态路由冲突。
- `reverse_proxy` 规则过于宽泛，未正确处理静态资源。

**解决方案**：
- 在 Caddyfile 中使用 `@matcher` 精确控制路由优先级，确保静态资源和 API 路由优先处理。
- 避免在 Caddy 中重写已被 Next.js 中间件处理的路径。
- 使用 `handle` 块分离不同路径的处理逻辑，例如：

```
handle /api/* {
    reverse_proxy localhost:3000
}

handle /_next/* {
    reverse_proxy localhost:3000
}

handle * {
    reverse_proxy localhost:3000
}
```

**Section sources**
- [next.config.ts](file://next.config.ts#L0-L102)
- [ecosystem.config.js](file://ecosystem.config.js#L0-L127)

## 总结

Caddy 凭借其自动化 HTTPS、简洁的声明式语法和强大的反向代理能力，为本项目的 Next.js 应用部署提供了高效、安全的解决方案。通过一份简洁的 Caddyfile，即可实现 HTTP 到 HTTPS 的自动重定向、Let's Encrypt 证书的自动管理、反向代理到 `localhost:3000`、静态资源的缓存控制、Gzip 压缩和安全头注入等关键功能。

结合 `next.config.ts` 中的 `headers` 配置，Caddy 能够与 Next.js 深度协同，实现精细化的性能优化与安全加固。同时，Caddy 极大地简化了运维工作，降低了配置复杂度，使开发者能够更专注于业务逻辑的开发。

通过遵循本指南的配置示例和问题解决方案，可确保 Caddy 在生产环境中稳定、高效地运行，为用户提供安全、快速的访问体验。