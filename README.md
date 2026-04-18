# split-check-page

一个用于对比源站和复刻站页面效果的小工具，默认支持移动端预览，也支持切换到 PC 端预览。

## 本地运行

确保机器已经安装 Node.js，然后执行：

```bash
node server.js
```

打开：

```bash
http://localhost:8155
```

## Docker 启动

```bash
docker compose up -d --build
```

打开：

```bash
http://localhost:8155
```

## 功能说明

- 支持粘贴或文件导入对比链接
- 支持浏览器本地持久化
- 支持移动端 / PC 端预览切换
- 左右并排查看源站和复刻站效果

## VPS 更新

```bash
git pull
docker compose up -d --build
```
