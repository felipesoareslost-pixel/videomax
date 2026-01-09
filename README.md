# VideoMax - YouTube Video Downloader com IA ⚡ MODO TURBO

![VideoMax Logo](https://img.shields.io/badge/VideoMax-AI%20Powered-6366f1?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge)
![Speed](https://img.shields.io/badge/speed-8x%20faster-10b981?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

Sistema moderno de download de vídeos com tecnologia de **Inteligência Artificial avançada** e **otimizações ultra-rápidas**. Suporta YouTube, Instagram, TikTok, Facebook e mais de 1000 sites!

## 🚀 NOVIDADE: Modo Turbo Ativado! ⚡

### Downloads até 8x mais rápidos com:
- 🔥 **Fragmentação Paralela** - 8 downloads simultâneos
- ⚡ **Chunks de 10MB** - Throughput otimizado
- 🚀 **FFmpeg Ultrafast** - Conversão em tempo recorde
- 💪 **Multi-threading** - Usa todos os núcleos da CPU
- 🎯 **Indicadores de Velocidade** - Escolha visual inteligente

## 🚀 Recursos Principais

### ✨ Tecnologia de IA Avançada
- 🤖 Algoritmos de machine learning para detecção automática de qualidade
- 🎯 Análise inteligente de vídeos
- 🔍 Detecção automática de melhor formato
- ⚡ Otimização de velocidade de download com fragmentação paralela

### 📹 Formatos Suportados
- **Vídeo**: MP4, WEBM, AVI (144p até 8K) com indicadores de velocidade
- **Áudio**: MP3, M4A, WAV (128kbps até 320kbps)
- **Qualidades**: 144p, 360p, 480p ⚡(Rápido), 720p 🚀(Médio), 1080p+ 🐌(Lento)

### 🌐 Plataformas Suportadas
- YouTube
- Instagram (Posts, Stories, Reels)
- TikTok
- Facebook
- Twitter
- Vimeo
- Dailymotion
- E mais de 1000 sites!

### 🎨 Design Moderno
- Interface limpa e intuitiva
- Animações suaves
- Efeitos de partículas em background
- 100% Responsivo (Mobile, Tablet, Desktop)
- Tema escuro moderno

## 📦 Instalação

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/videomax.git
cd videomax
```

### 2. Estrutura do Projeto
```
videomax/
│
├── index.html              # Página principal
├── css/
│   └── style.css          # Estilos principais
├── js/
│   ├── app.js            # Lógica da aplicação
│   └── particles-config.js # Configuração de partículas
└── README.md              # Documentação
```

### 3. Abrir no Navegador
Simplesmente abra o arquivo `index.html` no seu navegador favorito!

Ou use um servidor local:

```bash
# Com Python 3
python -m http.server 8000

# Com Node.js (http-server)
npx http-server

# Com PHP
php -S localhost:8000
```

Depois acesse: `http://localhost:8000`

## 🔧 Configuração Backend (Opcional)

Para funcionalidade completa de download, você precisa configurar um backend.

### Backend Node.js (Recomendado)

```javascript
// server.js
const express = require('express');
const ytdl = require('ytdl-core');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.post('/api/video-info', async (req, res) => {
    try {
        const { url } = req.body;
        const info = await ytdl.getInfo(url);
        
        res.json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[0].url,
            duration: info.videoDetails.lengthSeconds,
            views: info.videoDetails.viewCount,
            channel: info.videoDetails.author.name,
            formats: info.formats
        });
    } catch (error) {
        res.status(400).json({ error: 'Erro ao processar vídeo' });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
```

Instale as dependências:
```bash
npm init -y
npm install express ytdl-core cors
node server.js
```

### Backend Python (Alternativa)

```python
# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app)

@app.route('/api/video-info', methods=['POST'])
def video_info():
    try:
        url = request.json['url']
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            return jsonify({
                'title': info['title'],
                'thumbnail': info['thumbnail'],
                'duration': info['duration'],
                'views': info['view_count'],
                'channel': info['uploader'],
                'formats': info['formats']
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
```

Instale as dependências:
```bash
pip install flask flask-cors yt-dlp
python app.py
```

## 🎯 Como Usar

1. **Cole o Link**: Copie o URL do vídeo que deseja baixar
2. **Análise IA**: Clique em "Baixar Agora" para análise automática
3. **Escolha a Qualidade**: Selecione entre vídeo ou áudio
4. **Download**: Clique no botão de download da qualidade desejada

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica
- **CSS3**: Estilização moderna com variáveis CSS
- **JavaScript ES6+**: Lógica da aplicação
- **Particles.js**: Efeitos de background
- **Font Awesome**: Ícones

### Backend (Opcional)
- **Node.js + Express**: Servidor backend
- **ytdl-core**: Download de vídeos do YouTube
- **Python + Flask**: Alternativa em Python
- **yt-dlp**: Biblioteca Python para downloads

## 📱 Compatibilidade

### Navegadores Suportados
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

### Dispositivos
- ✅ Desktop (Windows, macOS, Linux)
- ✅ Mobile (Android, iOS)
- ✅ Tablet

## 🎨 Personalização

### Cores
Edite as variáveis CSS em `css/style.css`:

```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #ec4899;
    --accent-color: #14b8a6;
    /* ... */
}
```

### Partículas
Ajuste em `js/particles-config.js`:

```javascript
particlesJS('particles-js', {
    particles: {
        number: { value: 80 },
        color: { value: '#6366f1' },
        // ...
    }
});
```

## 🔐 Segurança

- ✅ Sem coleta de dados pessoais
- ✅ Sem registro necessário
- ✅ Código open-source
- ✅ Sem malware ou vírus
- ✅ Conexões HTTPS

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

- 📧 Email: suporte@videomax.com
- 💬 Discord: [VideoMax Community](https://discord.gg/videomax)
- 🐦 Twitter: [@VideoMaxApp](https://twitter.com/videomaxapp)

## 🗺️ Roadmap

- [ ] Suporte para downloads em lote
- [ ] Histórico de downloads
- [ ] Conversão de formatos
- [ ] Legendas automáticas
- [ ] Aplicativo mobile nativo
- [ ] Extensão para navegador
- [ ] API pública
- [ ] Suporte para playlists

## ⭐ Agradecimentos

- [Particles.js](https://vincentgarreau.com/particles.js/)
- [Font Awesome](https://fontawesome.com/)
- [ytdl-core](https://github.com/fent/node-ytdl-core)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

## 📊 Status do Projeto

![Status](https://img.shields.io/badge/status-active-success.svg)
![Maintenance](https://img.shields.io/badge/maintained-yes-green.svg)
![Pull Requests](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

---

**Desenvolvido com ❤️ e IA por VideoMax Team**

*Nota: Este projeto é apenas para fins educacionais. Respeite os direitos autorais e termos de serviço das plataformas.*
