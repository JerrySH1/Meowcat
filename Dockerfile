# 使用官方 Node.js 20 镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 并安装依赖
COPY package*.json ./
RUN npm install

# 复制所有源代码
COPY . .

# 构建前端静态文件
RUN npm run build

# 暴露端口 (默认3000，云端可能会动态指定)
EXPOSE 3000

# 启动后端服务
CMD ["npx", "tsx", "server.ts"]
