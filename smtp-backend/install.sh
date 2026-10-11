#!/bin/bash
# eBounce SMTP 验证后端一键安装脚本
# 用法：curl -sL <本脚本URL> | sudo bash
set -e

TARBALL_URL="https://muse.ai/files/1303715316166701/1637513524670339/dskvmrm92c87ypb7pizq4dju/ebounce-smtp-backend.tar.gz"

echo "=== [1/5] 下载部署包 ==="
mkdir -p /opt/ebounce
curl -sL "$TARBALL_URL" -o /tmp/ebounce.tar.gz
tar xzf /tmp/ebounce.tar.gz -C /opt/ebounce
ls /opt/ebounce/

echo "=== [2/5] 安装系统服务 ==="
SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(48))")
sed "s/REPLACE_WITH_LONG_RANDOM_SECRET/$SECRET/" /opt/ebounce/ebounce-verify.service > /etc/systemd/system/ebounce-verify.service
id www-data >/dev/null 2>&1 && chown -R www-data:www-data /opt/ebounce || true
sed -i 's/^User=www-data/User=nobody/' /etc/systemd/system/ebounce-verify.service 2>/dev/null || true
# 如果 www-data 存在则用 www-data，否则 nobody（上面已处理，这里确保一致）
if id www-data >/dev/null 2>&1; then
  sed -i 's/^User=nobody/User=www-data/' /etc/systemd/system/ebounce-verify.service
fi

echo "=== [3/5] 启动服务 ==="
systemctl daemon-reload
systemctl enable --now ebounce-verify
sleep 3
systemctl is-active --quiet ebounce-verify || { echo "服务启动失败，查看日志："; journalctl -u ebounce-verify -n 20 --no-pager; exit 1; }
echo "服务运行中，本地测试："
curl -s "http://127.0.0.1:8787/verify?email=someone@gmail.com" -H "X-Verify-Secret: $SECRET" | head -c 300
echo ""

echo "=== [4/5] 配置 nginx 反向代理 ==="
if ! command -v nginx >/dev/null 2>&1; then
  echo "未检测到 nginx，跳过自动配置。请手动把 127.0.0.1:8787 反代到 https://www.aceppe.com/_ebounce_verify/"
else
python3 << 'PYEOF'
import glob, re, shutil, sys

LOCATION = """
    # eBounce SMTP verify backend (auto-added)
    location /_ebounce_verify/ {
        proxy_pass http://127.0.0.1:8787/;
        proxy_set_header X-Verify-Secret $http_x_verify_secret;
    }
"""

candidates = glob.glob("/etc/nginx/sites-enabled/*") + glob.glob("/etc/nginx/conf.d/*.conf")
target = None
for f in candidates:
    try:
        txt = open(f).read()
    except Exception:
        continue
    # 找包含 aceppe.com 的 server_name 的 server 块
    if "aceppe.com" in txt and "server_name" in txt:
        target = f
        break

if not target:
    print("WARN: 没找到 www.aceppe.com 的 nginx 配置，请手动添加反代。")
    sys.exit(0)

txt = open(target).read()
if "_ebounce_verify" in txt:
    print("nginx 已配置过，跳过。")
    sys.exit(0)

shutil.copy(target, target + ".bak-ebounce")
# 找到最后一个 server 块的右花括号，在其之前插入 location
# 简单策略：在文件末尾的最后一个 "}" 之前插入
idx = txt.rstrip().rfind("}")
new_txt = txt.rstrip()[:idx] + LOCATION + txt.rstrip()[idx:] + "\n"
open(target, "w").write(new_txt)
print(f"已更新 {target}（原文件备份为 {target}.bak-ebounce）")
PYEOF
  if nginx -t 2>&1 | grep -q "successful"; then
    systemctl reload nginx
    echo "nginx 已重载"
  else
    echo "nginx 配置检查未通过，已保留备份，请手动检查"
    nginx -t || true
  fi
fi

echo ""
echo "=== [5/5] 完成 ==="
echo "对外地址：https://www.aceppe.com/_ebounce_verify/verify?email=xxx"
echo "密钥（请复制发给 Muse）："
echo "$SECRET"
echo ""
echo "外网测试命令（把 SECRET 换成上面的密钥）："
echo "curl -s \"https://www.aceppe.com/_ebounce_verify/verify?email=someone@gmail.com\" -H \"X-Verify-Secret: \$SECRET\" | head -c 300"
