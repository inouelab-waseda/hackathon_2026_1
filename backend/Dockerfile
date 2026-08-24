FROM python:3.12-slim

WORKDIR /app

# .pyc を作らない / ログを即座に吐く（docker compose logs で見えるようにする）
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 依存だけを先にインストールしてレイヤキャッシュを活かす
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
