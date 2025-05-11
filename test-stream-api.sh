#!/bin/bash

# 设置基本URL
BASE_URL="http://localhost:3001/api/stream"

# 默认参数
COUNT="5"
DELAY="500"

# 命令行参数处理
while [[ $# -gt 0 ]]; do
  case $1 in
    --count=*)
      COUNT="${1#*=}"
      shift
      ;;
    --delay=*)
      DELAY="${1#*=}"
      shift
      ;;
    --post)
      USE_POST=true
      shift
      ;;
    --help)
      echo "用法: $0 [选项]"
      echo "选项:"
      echo "  --count=N    设置消息数量 (默认: 5)"
      echo "  --delay=N    设置延迟毫秒数 (默认: 500)"
      echo "  --post       使用POST请求而不是GET"
      echo "  --help       显示此帮助信息"
      exit 0
      ;;
    *)
      echo "未知参数: $1"
      echo "使用 --help 查看帮助"
      exit 1
      ;;
  esac
done

# 输出请求信息
echo "测试流式响应API..."

if [ "$USE_POST" = true ]; then
  echo "使用POST请求: $BASE_URL"
  echo "参数: 消息数=$COUNT, 延迟=${DELAY}ms"
  echo "发送请求..."
  # POST 请求
  curl -X POST \
    -H "Content-Type: application/json" \
    -d "{\"count\": $COUNT, \"delay\": $DELAY, \"message\": \"自定义测试消息\"}" \
    --no-buffer \
    $BASE_URL
else
  echo "使用GET请求: $BASE_URL?count=$COUNT&delay=$DELAY"
  echo "发送请求..."
  # GET 请求
  curl -X GET --no-buffer "$BASE_URL?count=$COUNT&delay=$DELAY"
fi

echo -e "\n\n请求完成"
