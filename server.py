# -*- coding: utf-8 -*-
"""
VideoMax Backend - Sistema de Download de Vídeos
"""

from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import yt_dlp
import os
import uuid
import time
import re
from threading import Thread
import subprocess
import shutil

app = Flask(__name__, static_folder='.')
CORS(app)

# Encontrar FFmpeg automaticamente
def find_ffmpeg():
    """Encontra o executável do FFmpeg no sistema"""
    ffmpeg_path = shutil.which('ffmpeg')
    if ffmpeg_path:
        return os.path.dirname(ffmpeg_path)
    # Caminhos padrão do Windows
    possible_paths = [
        r'C:\ffmpeg\bin',
        r'C:\Program Files\ffmpeg\bin',
        os.path.expanduser(r'~\scoop\apps\ffmpeg\current\bin'),
        os.path.expanduser(r'~\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin')
    ]
    for path in possible_paths:
        if os.path.exists(path):
            return path
    return None

FFMPEG_LOCATION = find_ffmpeg()

# Caminho para o arquivo de cookies do YouTube
COOKIES_FILE = os.path.join(os.path.dirname(__file__), 'cookies.txt')

# Configurações
DOWNLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'downloads')
if not os.path.exists(DOWNLOAD_FOLDER):
    os.makedirs(DOWNLOAD_FOLDER)

# Armazenar status dos downloads
download_status = {}

def clean_old_files():
    """Remove arquivos antigos (mais de 1 hora)"""
    try:
        current_time = time.time()
        for filename in os.listdir(DOWNLOAD_FOLDER):
            filepath = os.path.join(DOWNLOAD_FOLDER, filename)
            if os.path.isfile(filepath):
                file_age = current_time - os.path.getmtime(filepath)
                if file_age > 3600:  # 1 hora
                    os.remove(filepath)
    except Exception as e:
        print(f"Erro ao limpar arquivos: {e}")

@app.route('/api/video-info', methods=['POST'])
def get_video_info():
    """Obtém informações do vídeo"""
    try:
        data = request.json
        url = data.get('url', '')
        
        if not url:
            return jsonify({'error': 'URL não fornecida'}), 400
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'no_check_certificate': True,
            'socket_timeout': 30,
        }
        
        # Usar cookies se o arquivo existir
        if os.path.exists(COOKIES_FILE) and os.path.getsize(COOKIES_FILE) > 100:
            ydl_opts['cookiefile'] = COOKIES_FILE
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Processar formatos de vídeo com múltiplas opções de conversão
            video_formats = []
            audio_formats = []
            
            # Qualidades disponíveis
            qualities = {}
            
            for fmt in info.get('formats', []):
                if fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none':
                    # Formato com vídeo e áudio
                    height = fmt.get('height', 0)
                    if height and height not in qualities:
                        quality = f"{height}p"
                        qualities[height] = {
                            'format_id': fmt['format_id'],
                            'quality': quality,
                            'resolution': f"{fmt.get('width', 0)}x{height}",
                            'size': fmt.get('filesize_approx', 0) or fmt.get('filesize', 0) or 0,
                            'fps': fmt.get('fps', 30),
                        }
            
            # Criar opções para cada qualidade em múltiplos formatos
            output_formats = [
                {'ext': 'MP4', 'codec': 'h264', 'name': 'MP4 (H.264)'},
                {'ext': 'AVI', 'codec': 'xvid', 'name': 'AVI (Xvid)'},
                {'ext': 'MKV', 'codec': 'h264', 'name': 'MKV (H.264)'},
                {'ext': 'MOV', 'codec': 'h264', 'name': 'MOV (H.264)'},
                {'ext': 'WMV', 'codec': 'wmv2', 'name': 'WMV'},
                {'ext': 'FLV', 'codec': 'flv', 'name': 'FLV'},
            ]
            
            for height in sorted(qualities.keys(), reverse=True):
                fmt = qualities[height]
                for output_fmt in output_formats:
                    video_formats.append({
                        'format_id': fmt['format_id'],
                        'quality': fmt['quality'],
                        'resolution': fmt['resolution'],
                        'size': format_size(fmt['size']) if fmt['size'] else 'N/A',
                        'fps': fmt['fps'],
                        'format': output_fmt['ext'],
                        'format_name': output_fmt['name'],
                        'codec': output_fmt['codec']
                    })
            
            # Formatos de áudio
            for fmt in info.get('formats', []):
                if fmt.get('acodec') != 'none' and fmt.get('vcodec') == 'none':
                    bitrate = fmt.get('abr', 0)
                    if bitrate and bitrate >= 128:
                        audio_formats.append({
                            'format_id': fmt['format_id'],
                            'quality': f"{int(bitrate)}kbps",
                            'size': format_size(fmt.get('filesize_approx', 0) or fmt.get('filesize', 0) or 0),
                            'format': 'MP3'
                        })
            
            # Remover duplicatas de áudio e limitar
            seen = set()
            audio_formats = [x for x in audio_formats if not (x['quality'] in seen or seen.add(x['quality']))]
            audio_formats = sorted(audio_formats, key=lambda x: int(x['quality'].replace('kbps', '')), reverse=True)[:4]
            
            return jsonify({
                'success': True,
                'id': info.get('id', ''),
                'title': info.get('title', 'Sem título'),
                'thumbnail': info.get('thumbnail', ''),
                'duration': str(int(info.get('duration', 0) // 60)) + ':' + str(int(info.get('duration', 0) % 60)).zfill(2),
                'views': format_views(info.get('view_count', 0)),
                'channel': info.get('uploader', 'Desconhecido'),
                'formats': {
                    'video': video_formats,
                    'audio': audio_formats
                }
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/download', methods=['POST'])
def download_video():
    """Inicia o download do vídeo"""
    try:
        data = request.json
        url = data.get('url', '')
        format_id = data.get('format_id', 'best')
        download_type = data.get('type', 'video')
        output_format = data.get('output_format', 'mp4').lower()
        codec = data.get('codec', 'h264')
        
        if not url:
            return jsonify({'error': 'URL não fornecida'}), 400
        
        # Gerar ID único para o download
        download_id = str(uuid.uuid4())
        
        # Iniciar download em thread separada
        thread = Thread(target=process_download, args=(download_id, url, format_id, download_type, output_format, codec))
        thread.start()
        
        return jsonify({
            'success': True,
            'download_id': download_id,
            'message': 'Download iniciado'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

def clean_filename(filename):
    """Remove caracteres inválidos do nome do arquivo"""
    # Remover caracteres inválidos para Windows/Linux
    invalid_chars = r'[<>:"/\\|?*]'
    cleaned = re.sub(invalid_chars, '', filename)
    # Remover espaços extras e limitar tamanho
    cleaned = ' '.join(cleaned.split())
    # Limitar a 200 caracteres
    if len(cleaned) > 200:
        cleaned = cleaned[:200]
    return cleaned

def process_download(download_id, url, format_id, download_type, output_format='mp4', codec='h264'):
    """Processa o download em background"""
    try:
        download_status[download_id] = {
            'status': 'downloading',
            'progress': 0,
            'filename': None
        }
        
        # Opções base para evitar bloqueio do YouTube
        base_opts = {
            'quiet': True,
            'no_check_certificate': True,
        }
        
        # Usar cookies se o arquivo existir
        if os.path.exists(COOKIES_FILE) and os.path.getsize(COOKIES_FILE) > 100:
            base_opts['cookiefile'] = COOKIES_FILE
        
        # Primeiro, obter informações do vídeo para pegar o título
        with yt_dlp.YoutubeDL(base_opts) as ydl_info:
            info = ydl_info.extract_info(url, download=False)
            video_title = info.get('title', 'video')
            clean_title = clean_filename(video_title)
        
        # Configurar opções de download com o título limpo
        filename = f"{clean_title}.%(ext)s"
        output_path = os.path.join(DOWNLOAD_FOLDER, filename)
        
        ydl_opts = {
            'format': format_id,
            'outtmpl': output_path,
            'progress_hooks': [lambda d: update_progress(download_id, d)],
            # OTIMIZAÇÕES DE VELOCIDADE BALANCEADAS
            'concurrent_fragment_downloads': 8,
            'http_chunk_size': 5242880,
            'buffersize': 32768,
            'retries': 50,
            'fragment_retries': 50,
            'extractor_retries': 30,
            'file_access_retries': 30,
            'socket_timeout': 180,
            'keepvideo': False,
            'noplaylist': True,
            'no_warnings': True,
            'quiet': False,
            'no_check_certificate': True,
            'prefer_ffmpeg': True,
            'continuedl': True,
            'noprogress': False,
            'overwrites': True,
        }
        
        # Usar cookies se o arquivo existir
        if os.path.exists(COOKIES_FILE) and os.path.getsize(COOKIES_FILE) > 100:
            ydl_opts['cookiefile'] = COOKIES_FILE
        
        # Adicionar localização do FFmpeg se disponível
        if FFMPEG_LOCATION:
            ydl_opts['ffmpeg_location'] = FFMPEG_LOCATION
        
        # Adicionar opções de conversão de formato
        if download_type == 'video' and output_format != 'mp4':
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': output_format,
            }]
            # Otimizar FFmpeg para velocidade
            ydl_opts['postprocessor_args'] = [
                '-preset', 'ultrafast',
                '-threads', '0',
            ]
        
        # Adicionar opções para áudio
        if download_type == 'audio':
            ydl_opts['format'] = 'bestaudio/best'
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '320',
            }]
            ydl_opts['postprocessor_args'] = [
                '-threads', '0',
            ]
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
            # Ajustar extensão baseado no tipo
            if download_type == 'audio':
                filename = filename.rsplit('.', 1)[0] + '.mp3'
            elif output_format != 'mp4':
                filename = filename.rsplit('.', 1)[0] + '.' + output_format
            
            download_status[download_id] = {
                'status': 'completed',
                'progress': 100,
                'filename': os.path.basename(filename)
            }
    
    except Exception as e:
        download_status[download_id] = {
            'status': 'error',
            'progress': 0,
            'error': str(e)
        }

def update_progress(download_id, d):
    """Atualiza progresso do download"""
    if d['status'] == 'downloading':
        downloaded = d.get('downloaded_bytes', 0)
        total = d.get('total_bytes', 0) or d.get('total_bytes_estimate', 0)
        
        if total > 0:
            progress = int((downloaded / total) * 100)
            download_status[download_id]['progress'] = progress

@app.route('/api/download-status/<download_id>', methods=['GET'])
def get_download_status(download_id):
    """Obtém status do download"""
    status = download_status.get(download_id, {'status': 'not_found'})
    return jsonify(status)

@app.route('/api/download-file/<download_id>', methods=['GET'])
def download_file(download_id):
    """Baixa o arquivo"""
    try:
        status = download_status.get(download_id)
        if not status or status['status'] != 'completed':
            return jsonify({'error': 'Download não encontrado ou não completo'}), 404
        
        filename = status['filename']
        filepath = os.path.join(DOWNLOAD_FOLDER, filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Arquivo não encontrado'}), 404
        
        return send_file(filepath, as_attachment=True)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def format_views(views):
    """Formata número de visualizações"""
    if views >= 1000000:
        return f"{views / 1000000:.1f}M"
    elif views >= 1000:
        return f"{views / 1000:.1f}K"
    else:
        return str(views)

def format_size(size):
    """Formata tamanho de arquivo"""
    if size > 1024 * 1024 * 1024:
        return f"{size / (1024 * 1024 * 1024):.2f} GB"
    elif size > 1024 * 1024:
        return f"{size / (1024 * 1024):.0f} MB"
    else:
        return f"{size / 1024:.0f} KB"

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica se o servidor está funcionando"""
    return jsonify({'status': 'ok', 'message': 'VideoMax Backend Online'})

@app.route('/')
def index():
    """Serve a página principal"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve arquivos estáticos"""
    return send_from_directory('.', path)

if __name__ == '__main__':
    # Limpar arquivos antigos ao iniciar
    clean_old_files()
    
    # Pegar porta do ambiente (para Render/Heroku) ou usar 5000
    port = int(os.environ.get('PORT', 5000))
    
    print("=" * 60)
    print("🚀 VideoMax Backend Iniciado!")
    print("=" * 60)
    print(f"📡 Servidor rodando em: http://localhost:{port}")
    print("🎬 Sistema de download pronto!")
    print("=" * 60)
    
    app.run(debug=False, host='0.0.0.0', port=port)
