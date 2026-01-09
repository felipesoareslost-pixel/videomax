FROM python:3.11-slim

# Instalar FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar requirements e instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar pasta de downloads
RUN mkdir -p downloads

# Expor porta
EXPOSE 10000

# Comando para iniciar
CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:10000", "--workers", "2", "--timeout", "300"]
