// ==========================================
// VIDEO DOWNLOADER APP WITH AI
// ==========================================

class VideoDownloader {
    constructor() {
        this.init();
        this.attachEventListeners();
    }

    init() {
        // DOM Elements
        this.videoUrlInput = document.getElementById('videoUrl');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.videoResult = document.getElementById('videoResult');
        this.closeResultBtn = document.getElementById('closeResult');
        
        // Result elements
        this.videoThumbnail = document.getElementById('videoThumbnail');
        this.videoTitle = document.getElementById('videoTitle');
        this.videoDuration = document.getElementById('videoDuration');
        this.videoViews = document.getElementById('videoViews');
        this.videoChannel = document.getElementById('videoChannel');
        this.videoOptions = document.getElementById('videoOptions');
        this.audioOptions = document.getElementById('audioOptions');
        
        // State
        this.currentVideo = null;
        this.isLoading = false;
    }

    attachEventListeners() {
        // Download button
        this.downloadBtn.addEventListener('click', () => this.handleDownload());
        
        // Clear button
        this.clearBtn.addEventListener('click', () => this.clearInput());
        
        // Enter key
        this.videoUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleDownload();
        });
        
        // Close result
        this.closeResultBtn.addEventListener('click', () => this.closeResult());
        
        // Format tabs
        document.querySelectorAll('.format-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchFormat(e.target.dataset.format));
        });
        
        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                this.showToast(`Cole o link do ${platform} e clique em Baixar!`);
                this.videoUrlInput.focus();
            });
        });
        
        // FAQ accordion
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                item.classList.toggle('active');
            });
        });
        
        // Mobile menu
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
    }

    async handleDownload() {
        const url = this.videoUrlInput.value.trim();
        
        if (!url) {
            this.showToast('Por favor, cole um link válido!', 'error');
            return;
        }
        
        if (!this.isValidUrl(url)) {
            this.showToast('URL inválida! Verifique o link e tente novamente.', 'error');
            return;
        }
        
        this.setLoading(true);
        
        try {
            // Simulate AI analysis
            await this.simulateAIAnalysis();
            
            // Get video info (simulated)
            const videoInfo = await this.getVideoInfo(url);
            
            // Display results
            this.displayVideoInfo(videoInfo);
            this.showResult();
            
            this.showToast('Vídeo analisado com sucesso!', 'success');
        } catch (error) {
            this.showToast('Erro ao processar o vídeo. Tente novamente.', 'error');
            console.error(error);
        } finally {
            this.setLoading(false);
        }
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    async simulateAIAnalysis() {
        // Simulate AI processing time
        return new Promise(resolve => {
            setTimeout(resolve, 2000);
        });
    }

    async getVideoInfo(url) {
        // Call backend API
        try {
            const response = await fetch('/api/video-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                // Tentar fallback com Cobalt
                console.log('yt-dlp falhou, tentando Cobalt...');
                return await this.getVideoInfoCobalt(url);
            }
            
            return data;
        } catch (error) {
            // Tentar fallback com Cobalt
            console.log('Erro no backend, tentando Cobalt...', error);
            try {
                return await this.getVideoInfoCobalt(url);
            } catch (cobaltError) {
                // Se o backend não estiver rodando, mostrar instruções
                if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                    this.showBackendError();
                    throw new Error('Backend não está rodando');
                }
                throw error;
            }
        }
    }

    async getVideoInfoCobalt(url) {
        // Fallback: usar endpoint Cobalt do backend
        try {
            const response = await fetch('/api/cobalt-download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, type: 'video' })
            });
            
            const data = await response.json();
            
            if (data.success && data.download_url) {
                // Extrair título do URL ou usar genérico
                const videoId = this.extractVideoId(url);
                return {
                    success: true,
                    id: 'cobalt',
                    title: data.filename || `Video ${videoId}`,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    duration: 'N/A',
                    views: 'N/A',
                    channel: 'YouTube',
                    use_cobalt: true,
                    cobalt_url: data.download_url,
                    formats: {
                        video: [
                            {format_id: 'cobalt_best', quality: 'Melhor Qualidade', resolution: 'Auto', size: 'N/A', fps: 30, format: 'MP4', format_name: 'MP4 (Auto)', codec: 'h264'}
                        ],
                        audio: [
                            {format_id: 'cobalt_audio', quality: '320kbps', size: 'N/A', format: 'MP3'}
                        ]
                    }
                };
            }
            throw new Error('Cobalt não retornou URL válida');
        } catch (error) {
            throw new Error('Não foi possível processar o vídeo');
        }
    }

    extractVideoId(url) {
        // Extract video ID from YouTube URL (simplified)
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : 'demo_video';
    }

    displayVideoInfo(info) {
        this.currentVideo = info;
        
        // Set video details
        this.videoThumbnail.src = info.thumbnail;
        this.videoTitle.textContent = info.title;
        this.videoDuration.innerHTML = `<i class="fas fa-clock"></i> ${info.duration}`;
        this.videoViews.innerHTML = `<i class="fas fa-eye"></i> ${info.views}`;
        this.videoChannel.innerHTML = `<i class="fas fa-user"></i> ${info.channel}`;
        
        // Generate video options
        this.generateVideoOptions(info.formats.video);
        
        // Generate audio options
        this.generateAudioOptions(info.formats.audio);
    }

    generateVideoOptions(formats) {
        // Adicionar indicador de velocidade
        const addSpeedIndicator = (quality) => {
            const height = parseInt(quality);
            if (height <= 480) return '<span class="speed-badge fast">⚡ Rápido</span>';
            if (height <= 720) return '<span class="speed-badge medium">🚀 Médio</span>';
            return '<span class="speed-badge slow">🐌 Lento</span>';
        };
        
        // Agrupar por qualidade
        const groupedByQuality = {};
        formats.forEach((format, index) => {
            if (!groupedByQuality[format.quality]) {
                groupedByQuality[format.quality] = {
                    resolution: format.resolution,
                    fps: format.fps,
                    formats: []
                };
            }
            groupedByQuality[format.quality].formats.push({ ...format, originalIndex: index });
        });

        // Gerar HTML organizado
        this.videoOptions.innerHTML = Object.keys(groupedByQuality)
            .sort((a, b) => parseInt(b) - parseInt(a))
            .map(quality => {
                const group = groupedByQuality[quality];
                const formatButtons = group.formats.map(fmt => `
                    <button class="format-select-btn" onclick="app.downloadFile('video', ${fmt.originalIndex})" title="${fmt.format_name}">
                        <i class="fas fa-file-video"></i>
                        <span>${fmt.format}</span>
                    </button>
                `).join('');

                return `
                    <div class="quality-group">
                        <div class="quality-header">
                            <div class="quality-badge-large">${quality}</div>
                            <div class="quality-info-text">
                                <h5>${group.resolution} ${addSpeedIndicator(quality)}</h5>
                                <div class="quality-specs">
                                    <span><i class="fas fa-film"></i> ${group.fps}fps</span>
                                </div>
                            </div>
                        </div>
                        <div class="format-selector">
                            <label>Escolha o formato:</label>
                            <div class="format-buttons">
                                ${formatButtons}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    generateAudioOptions(formats) {
        this.audioOptions.innerHTML = formats.map((format, index) => `
            <div class="quality-item">
                <div class="quality-info">
                    <div class="quality-badge">${format.quality}</div>
                    <div class="quality-details">
                        <h5>${format.format} Audio</h5>
                        <div class="quality-specs">
                            <span><i class="fas fa-hdd"></i> ${format.size}</span>
                        </div>
                    </div>
                </div>
                <button class="quality-download-btn" onclick="app.downloadFile('audio', ${index})">
                    <i class="fas fa-download"></i>
                    Baixar
                </button>
            </div>
        `).join('');
    }

    switchFormat(format) {
        // Update active tab
        document.querySelectorAll('.format-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.format === format) {
                tab.classList.add('active');
            }
        });
        
        // Show/hide options
        if (format === 'video') {
            this.videoOptions.style.display = 'grid';
            this.audioOptions.style.display = 'none';
        } else {
            this.videoOptions.style.display = 'none';
            this.audioOptions.style.display = 'grid';
        }
    }

    async downloadFile(type, index) {
        if (!this.currentVideo) return;
        
        const format = type === 'video' 
            ? this.currentVideo.formats.video[index]
            : this.currentVideo.formats.audio[index];
        
        const videoUrl = this.videoUrlInput.value.trim();
        
        this.showToast(`🚀 Preparando download: ${format.quality} ${format.format}...`, 'success');
        
        try {
            // Iniciar download no backend
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: videoUrl,
                    format_id: format.format_id,
                    type: type,
                    output_format: format.format ? format.format.toLowerCase() : 'mp4',
                    codec: format.codec || 'h264',
                    use_cobalt: this.currentVideo.use_cobalt || false,
                    cobalt_url: this.currentVideo.cobalt_url || ''
                })
            });
            
            if (!response.ok) {
                throw new Error('Erro ao iniciar download');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Erro ao iniciar download');
            }
            
            // Se for download direto via Cobalt, abrir URL
            if (data.direct_url) {
                this.showToast(`✅ Abrindo download...`, 'success');
                window.open(data.direct_url, '_blank');
                return;
            }
            
            // Monitorar progresso
            this.monitorDownload(data.download_id, format);
            
        } catch (error) {
            if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                this.showBackendError();
            } else {
                this.showToast('❌ Erro ao iniciar download: ' + error.message, 'error');
            }
            console.error('Download error:', error);
        }
    }

    async monitorDownload(downloadId, format) {
        // Criar overlay de download fixo
        const overlay = document.createElement('div');
        overlay.id = 'download-overlay';
        overlay.innerHTML = `
            <div class="download-progress-card">
                <div class="download-header">
                    <h3>📥 Baixando Vídeo</h3>
                    <p>${format.quality} ${format.format}</p>
                </div>
                <div class="progress-container">
                    <div class="progress-circle">
                        <svg width="120" height="120">
                            <circle cx="60" cy="60" r="54" class="progress-bg"></circle>
                            <circle cx="60" cy="60" r="54" class="progress-bar" id="progress-circle"></circle>
                        </svg>
                        <div class="progress-text" id="progress-percent">0%</div>
                    </div>
                </div>
                <div class="download-status" id="download-status">Iniciando download...</div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        const progressCircle = document.getElementById('progress-circle');
        const progressPercent = document.getElementById('progress-percent');
        const downloadStatus = document.getElementById('download-status');
        const circumference = 2 * Math.PI * 54;
        
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference;
        
        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/download-status/${downloadId}`);
                const data = await response.json();
                
                if (data.status === 'downloading') {
                    const progress = data.progress || 0;
                    const offset = circumference - (progress / 100) * circumference;
                    progressCircle.style.strokeDashoffset = offset;
                    progressPercent.textContent = `${progress}%`;
                    downloadStatus.textContent = `Baixando... ${progress}%`;
                    setTimeout(checkStatus, 500);
                } else if (data.status === 'completed') {
                    progressCircle.style.strokeDashoffset = 0;
                    progressPercent.textContent = '100%';
                    downloadStatus.innerHTML = '✅ <strong>Download Concluído!</strong>';
                    
                    setTimeout(() => {
                        overlay.remove();
                        this.showToast(`✅ Download concluído!`, 'success');
                        // Iniciar download do arquivo
                        window.location.href = `/api/download-file/${downloadId}`;
                        
                        // Recarregar a página para voltar ao início após 2 segundos
                        setTimeout(() => {
                            location.href = '/';
                        }, 2000);
                    }, 1500);
                } else if (data.status === 'error') {
                    overlay.remove();
                    this.showToast(`❌ Erro no download: ${data.error}`, 'error');
                }
            } catch (error) {
                console.error('Error checking status:', error);
                overlay.remove();
            }
        };
        
        checkStatus();
    }

    showBackendError() {
        const instructions = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🚫</div>
                <h3 style="margin-bottom: 1rem; color: #ef4444;">Backend Não Encontrado</h3>
                
                <p style="color: #cbd5e1; margin-bottom: 2rem; line-height: 1.6;">
                    O servidor backend não está rodando. Para usar o VideoMax, você precisa iniciar o servidor Python.
                </p>
                
                <div style="background: rgba(99, 102, 241, 0.1); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem; text-align: left;">
                    <h4 style="margin-bottom: 1rem; color: #6366f1;">🚀 Como Iniciar o Backend:</h4>
                    
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                        <p style="margin-bottom: 0.5rem; color: #94a3b8; font-size: 0.875rem;"><strong>1. Instale as dependências:</strong></p>
                        <code style="color: #10b981;">pip install -r requirements.txt</code>
                    </div>
                    
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 1rem; border-radius: 0.5rem;">
                        <p style="margin-bottom: 0.5rem; color: #94a3b8; font-size: 0.875rem;"><strong>2. Inicie o servidor:</strong></p>
                        <code style="color: #10b981;">python server.py</code>
                    </div>
                </div>
                
                <div style="background: rgba(236, 72, 153, 0.1); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                    <p style="color: #ec4899; font-weight: 600;">⚡ O servidor deve estar rodando em http://localhost:5000</p>
                </div>
                
                <button onclick="document.getElementById('modal-container').style.display='none'" 
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; color: white; font-weight: 600; cursor: pointer;">
                    Entendi
                </button>
            </div>
        `;
        
        this.showModal(instructions);
    }

    showModal(content) {
        const modal = document.getElementById('modal-container');
        const modalContent = modal.querySelector('.modal-text-cont-for-js');
        
        modalContent.innerHTML = content;
        modal.style.display = 'flex';
        
        // Close modal on shade click
        modal.querySelector('.shade').onclick = () => {
            modal.style.display = 'none';
        };
        
        modal.querySelector('.close-modal').onclick = () => {
            modal.style.display = 'none';
        };
    }

    showResult() {
        // Hide hero section elements
        document.querySelector('.hero').style.display = 'none';
        
        // Show result section
        this.videoResult.style.display = 'block';
        
        // Scroll to result
        setTimeout(() => {
            this.videoResult.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    closeResult() {
        // Show hero section
        document.querySelector('.hero').style.display = 'flex';
        
        // Hide result section
        this.videoResult.style.display = 'none';
        
        // Clear input
        this.clearInput();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    clearInput() {
        this.videoUrlInput.value = '';
        this.videoUrlInput.focus();
    }

    setLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.downloadBtn.classList.add('loading');
            this.downloadBtn.disabled = true;
        } else {
            this.downloadBtn.classList.remove('loading');
            this.downloadBtn.disabled = false;
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const icon = toast.querySelector('i');
        
        toastMessage.textContent = message;
        
        // Update icon based on type
        if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle';
            icon.style.color = '#ef4444';
        } else {
            icon.className = 'fas fa-check-circle';
            icon.style.color = '#10b981';
        }
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// ==========================================
// INITIALIZE APP
// ==========================================

let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new VideoDownloader();
    
    // Add scroll effect to header
    let lastScroll = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.padding = '0.5rem 0';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.padding = '1rem 0';
            header.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Format number with K/M suffix
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Format duration to MM:SS
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Detect platform from URL
function detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'youtube';
    }
    if (url.includes('instagram.com')) {
        return 'instagram';
    }
    if (url.includes('tiktok.com')) {
        return 'tiktok';
    }
    if (url.includes('facebook.com') || url.includes('fb.watch')) {
        return 'facebook';
    }
    if (url.includes('twitter.com') || url.includes('x.com')) {
        return 'twitter';
    }
    return 'unknown';
}

// ==========================================
// SERVICE WORKER (Optional - for PWA)
// ==========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered:', registration))
        //     .catch(error => console.log('SW registration failed:', error));
    });
}

// ==========================================
// ANALYTICS (Optional)
// ==========================================

// Track download button clicks
function trackDownloadClick(quality, format) {
    // Add your analytics code here
    console.log(`Download tracked: ${quality} ${format}`);
}

// Track page views
function trackPageView(page) {
    // Add your analytics code here
    console.log(`Page view tracked: ${page}`);
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + V to focus input
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const input = document.getElementById('videoUrl');
        if (document.activeElement !== input) {
            e.preventDefault();
            input.focus();
        }
    }
    
    // Escape to close result
    if (e.key === 'Escape') {
        const resultSection = document.getElementById('videoResult');
        if (resultSection.style.display !== 'none') {
            app.closeResult();
        }
    }
});

// ==========================================
// CLIPBOARD DETECTION (DISABLED)
// ==========================================

// Clipboard detection disabled to avoid permission popups
// Users can manually paste links using Ctrl+V

// ==========================================
// EXPORT FOR DEBUGGING
// ==========================================

window.VideoDownloader = VideoDownloader;
