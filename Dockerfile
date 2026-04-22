FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY . .

WORKDIR /app/backend

EXPOSE 8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
