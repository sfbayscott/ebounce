# eBounce SMTP 深度验证后端 — 服务器部署指南

在 172.233.84.157（www.aceppe.com 那台 Linode）上执行，全程约 10 分钟。

## 1. 上传文件

```bash
sudo mkdir -p /opt/ebounce
# 把 smtp_verify.py 传到 /opt/ebounce/
sudo cp smtp_verify.py /opt/ebounce/
sudo chown -R www-data:www-data /opt/ebounce
```

## 2. 生成密钥并安装 systemd 服务

```bash
# 生成随机密钥（复制输出）
python3 -c "import secrets; print(secrets.token_urlsafe(48))"

sudo cp ebounce-verify.service /etc/systemd/system/
sudo nano /etc/systemd/system/ebounce-verify.service   # 把 REPLACE_WITH_LONG_RANDOM_SECRET 换成上一步的密钥
sudo systemctl daemon-reload
sudo systemctl enable --now ebounce-verify
sudo systemctl status ebounce-verify   # 应显示 active (running)
```

## 3. 本机测试

```bash
curl -s "http://127.0.0.1:8787/verify?email=test@gmail.com" -H "X-Verify-Secret: <你的密钥>"
# 期望返回类似：{"email":"test@gmail.com","verdict":"pass","reason":"smtp-ok","smtp_ok":true,"catch_all":false,...}
```

## 4. 让 Cloudflare Worker 能调用（反向代理 + HTTPS）

服务只监听 127.0.0.1，需要经 nginx 转发出去。假设服务器上已有 nginx（WordPress 站一般有）：

```nginx
# 在 www.aceppe.com 的 server 块里加：
location /_ebounce_verify/ {
    proxy_pass http://127.0.0.1:8787/;
    proxy_set_header X-Verify-Secret $http_x_verify_secret;  # 透传密钥头
}
```

然后 `sudo nginx -t && sudo systemctl reload nginx`。

测试（从外面）：

```bash
curl -s "https://www.aceppe.com/_ebounce_verify/verify?email=test@gmail.com" -H "X-Verify-Secret: <你的密钥>"
```

## 5. 告诉我两件事

1. 密钥（X-Verify-Secret 的值）——我把它配进 Worker 的 secrets
2. 最终对外地址（默认 `https://www.aceppe.com/_ebounce_verify`）

配好后 Worker 的 `/api/check` 会自动升级：先走原有预筛（语法/MX/一次性/职位），再调这台服务器做 SMTP 真实验证 + catch-all 检测。服务器连不上时自动降级回预筛，不中断服务。

## 安全说明

- 密钥头必填，无密钥返回 401；服务本身不对外暴露端口
- 探测只做 RCPT TO，不发真实邮件；每 IP 限 30 次/分钟
- 验证量很小（免费档 1 万/月 ≈ 每天 300 次），不会影响网站
