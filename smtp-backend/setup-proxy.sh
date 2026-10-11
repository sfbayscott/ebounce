#!/bin/bash
# eBounce 反代配置脚本（OpenResty/nginx 通用）
# 用法：curl -sL <本脚本URL> | sudo bash
set -e

NGINX_BIN=""
for b in openresty /usr/local/openresty/nginx/sbin/nginx /usr/local/openresty/bin/openresty nginx /usr/sbin/nginx; do
  if command -v $b >/dev/null 2>&1; then NGINX_BIN=$b; break; fi
done
[ -z "$NGINX_BIN" ] && { echo "找不到 openresty/nginx"; exit 1; }
echo "使用: $NGINX_BIN"

python3 << 'PYEOF'
import glob, re, shutil, sys, subprocess

LOCATION = """
    # eBounce SMTP verify backend (auto-added)
    location /_ebounce_verify/ {
        proxy_pass http://127.0.0.1:8787/;
        proxy_set_header X-Verify-Secret $http_x_verify_secret;
    }
"""

# 找主配置文件
main_conf = None
for p in ["/usr/local/openresty/nginx/conf/nginx.conf", "/etc/nginx/nginx.conf"]:
    try:
        open(p).read()
        main_conf = p
        break
    except Exception:
        continue
if not main_conf:
    print("WARN: 找不到主配置文件")
    sys.exit(0)

def all_conf_files(conf):
    files = [conf]
    try:
        txt = open(conf).read()
    except Exception:
        return files
    base = "/".join(conf.split("/")[:-1])
    for m in re.finditer(r"include\s+([^;]+);", txt):
        pat = m.group(1).strip()
        if not pat.startswith("/"):
            pat = base + "/" + pat
        for f in glob.glob(pat):
            if f not in files:
                files.append(f)
    return files

target = None
for f in all_conf_files(main_conf):
    try:
        txt = open(f).read()
    except Exception:
        continue
    if "aceppe.com" in txt and "server_name" in txt and "server" in txt:
        target = f
        break

if not target:
    print("WARN: 没找到 www.aceppe.com 的 server 配置")
    sys.exit(0)

txt = open(target).read()
if "_ebounce_verify" in txt:
    print("已配置过，跳过。")
    sys.exit(0)

shutil.copy(target, target + ".bak-ebounce")
idx = txt.rstrip().rfind("}")
new_txt = txt.rstrip()[:idx] + LOCATION + txt.rstrip()[idx:] + "\n"
open(target, "w").write(new_txt)
print(f"已更新 {target}")
PYEOF

echo "检查配置..."
if $NGINX_BIN -t 2>&1 | grep -qi "successful\|ok"; then
  $NGINX_BIN -s reload
  echo "已重载"
else
  $NGINX_BIN -t || true
  echo "配置检查未通过，请手动检查"
  exit 1
fi

sleep 2
echo "外网测试（应返回 JSON）："
curl -s "https://www.aceppe.com/_ebounce_verify/verify?email=someone@gmail.com" -H "X-Verify-Secret: PLACEHOLDER" | head -c 200
echo ""
echo "注意：上面用了占位密钥所以返回 401 是正常的，说明反代已通。"
