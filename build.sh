#!/usr/bin/env bash
# Script de build para o Render - instala FFmpeg e dependências

set -e

# Instalar dependências Python
pip install -r requirements.txt

# Instalar FFmpeg via apt (Render usa Ubuntu)
apt-get update && apt-get install -y ffmpeg || true

echo "Build concluído com sucesso!"
