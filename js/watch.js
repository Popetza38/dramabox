/**
 * DramaPop Watch Page JavaScript
 * Premium Theater Mode with iOS-optimized video player
 */

const WatchPage = {
    state: {
        bookId: null,
        currentEpisode: 1,
        chapters: [],
        hls: null,
        dramaData: null,
        isFullscreen: false,
        isFavorite: false,
        controlsTimeout: null,
        isIOS: false
    },

    // ========================================
    // iOS Detection Utilities
    // ========================================

    isIOSDevice() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    },

    getIOSVersion() {
        const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
        return match ? parseFloat(`${match[1]}.${match[2]}`) : 0;
    },

    isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    },

    // ========================================
    // Initialization
    // ========================================

    async init() {
        Common.init();
        this.state.bookId = Common.getUrlParam('id');
        this.state.currentEpisode = parseInt(Common.getUrlParam('ep')) || 1;
        this.state.isIOS = this.isIOSDevice();

        console.log('[WatchPage] Initializing...', {
            isIOS: this.state.isIOS,
            iOSVersion: this.getIOSVersion(),
            isSafari: this.isSafari()
        });

        if (!this.state.bookId) {
            Common.showError('ไม่พบข้อมูลซีรี่ย์');
            return;
        }

        this.bindEvents();
        await this.loadDrama();
    },

    bindEvents() {
        document.getElementById('watchBackBtn')?.addEventListener('click', () => {
            window.location.href = `detail.html?id=${this.state.bookId}`;
        });

        // Info panel buttons
        document.getElementById('infoFavBtn')?.addEventListener('click', () => {
            this.toggleFavorite();
        });

        document.getElementById('infoShareBtn')?.addEventListener('click', () => {
            this.shareContent();
        });

        // Video controls
        this.initVideoPlayer();

        // Big play button for iOS
        this.initPlayOverlay();

        // Touch controls for mobile
        this.initTouchControls();

        // Track fullscreen changes
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());

        // Show top bar on mouse movement
        let hideTimeout;
        document.querySelector('.watch-page')?.addEventListener('mousemove', () => {
            document.querySelector('.watch-top-bar')?.classList.add('visible');
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                document.querySelector('.watch-top-bar')?.classList.remove('visible');
            }, 3000);
        });
    },

    // ========================================
    // Play Overlay (iOS tap-to-play)
    // ========================================

    initPlayOverlay() {
        const overlay = document.getElementById('playOverlay');
        const bigPlayBtn = document.getElementById('bigPlayBtn');
        const video = document.getElementById('videoPlayer');

        if (!overlay || !bigPlayBtn || !video) return;

        const startPlayback = async () => {
            try {
                // Show loading
                document.getElementById('videoLoading')?.classList.remove('hidden');

                await video.play();
                overlay.classList.add('hidden');
                console.log('[PlayOverlay] Playback started successfully');
            } catch (err) {
                console.log('[PlayOverlay] Play failed:', err);
                // Keep overlay visible for retry
                document.getElementById('videoLoading')?.classList.add('hidden');
            }
        };

        bigPlayBtn.addEventListener('click', startPlayback);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                startPlayback();
            }
        });

        // Listen for video events to manage overlay
        video.addEventListener('play', () => {
            overlay.classList.add('hidden');
        });

        video.addEventListener('pause', () => {
            // Don't show overlay on pause - use controls instead
        });

        video.addEventListener('ended', () => {
            overlay.classList.remove('hidden');
        });
    },

    // ========================================
    // Touch Controls for Mobile
    // ========================================

    initTouchControls() {
        const container = document.getElementById('videoContainer');
        const video = document.getElementById('videoPlayer');

        if (!container || !video) return;

        let lastTap = 0;
        let tapTimeout = null;

        container.addEventListener('touchstart', (e) => {
            container.classList.add('touching');
        });

        container.addEventListener('touchend', (e) => {
            container.classList.remove('touching');

            // Ignore if touching controls
            if (e.target.closest('.video-controls') ||
                e.target.closest('.video-play-overlay')) {
                return;
            }

            const now = Date.now();
            const tapLength = now - lastTap;

            if (tapTimeout) clearTimeout(tapTimeout);

            if (tapLength < 300 && tapLength > 0) {
                // Double tap detected
                const rect = container.getBoundingClientRect();
                const tapX = e.changedTouches[0].clientX - rect.left;
                const width = rect.width;

                if (tapX < width * 0.3) {
                    // Left side - rewind 10s
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    this.showSkipFeedback('backward');
                } else if (tapX > width * 0.7) {
                    // Right side - forward 10s
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    this.showSkipFeedback('forward');
                } else {
                    // Center - toggle fullscreen
                    this.toggleFullscreen();
                }
                e.preventDefault();
            } else {
                // Single tap - toggle controls
                tapTimeout = setTimeout(() => {
                    this.toggleControls();
                }, 300);
            }

            lastTap = now;
        });
    },

    showSkipFeedback(direction) {
        // Could add visual feedback here
        console.log(`[Touch] Skip ${direction}`);
    },

    toggleControls() {
        const container = document.getElementById('videoContainer');
        container?.classList.toggle('show-controls');

        // Auto-hide after 3 seconds
        clearTimeout(this.state.controlsTimeout);
        this.state.controlsTimeout = setTimeout(() => {
            container?.classList.remove('show-controls');
        }, 3000);
    },

    // ========================================
    // Fullscreen Handling (iOS Compatible)
    // ========================================

    handleFullscreenChange() {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        this.state.isFullscreen = isFs;

        const btn = document.getElementById('fullscreenBtn');
        if (btn) {
            btn.innerHTML = isFs ?
                '<i class="fas fa-compress"></i>' :
                '<i class="fas fa-expand"></i>';
        }
    },

    toggleFullscreen() {
        const container = document.getElementById('videoContainer');
        const video = document.getElementById('videoPlayer');

        if (this.state.isIOS) {
            // iOS: Use webkitEnterFullscreen on video element
            if (video.webkitEnterFullscreen) {
                video.webkitEnterFullscreen();
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
            }
        } else if (document.fullscreenElement || document.webkitFullscreenElement) {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        } else {
            // Enter fullscreen
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }
        }
    },

    // ========================================
    // Share & Favorites
    // ========================================

    async shareContent() {
        const url = window.location.href;
        const title = this.state.dramaData?.bookName || 'DramaPop';

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${title} - ตอนที่ ${this.state.currentEpisode}`,
                    text: `ดู ${title} ตอนที่ ${this.state.currentEpisode} บน DramaPop`,
                    url: url
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this.copyToClipboard(url);
                }
            }
        } else {
            this.copyToClipboard(url);
        }
    },

    copyToClipboard(text) {
        navigator.clipboard?.writeText(text).then(() => {
            Swal.fire({
                toast: true,
                position: 'top',
                icon: 'success',
                title: 'คัดลอกลิงก์แล้ว',
                showConfirmButton: false,
                timer: 1500,
                background: 'rgba(20, 20, 45, 0.95)',
                color: '#fff'
            });
        });
    },

    toggleFavorite() {
        const dramaData = this.state.dramaData;
        if (!dramaData) return;

        const added = Favorites.toggle({
            bookId: this.state.bookId,
            bookName: dramaData.bookName || 'Unknown',
            cover: dramaData.cover || '',
            chapterCount: dramaData.chapterCount || 0
        });

        this.state.isFavorite = added;
        const btn = document.getElementById('infoFavBtn');
        btn?.classList.toggle('active', added);

        Swal.fire({
            toast: true,
            position: 'top',
            icon: added ? 'success' : 'info',
            title: added ? 'เพิ่มในรายการโปรดแล้ว' : 'ลบออกจากรายการโปรดแล้ว',
            showConfirmButton: false,
            timer: 1500,
            background: 'rgba(20, 20, 45, 0.95)',
            color: '#fff'
        });
    },

    // ========================================
    // Load Drama & Video
    // ========================================

    async loadDrama() {
        document.getElementById('videoLoading')?.classList.remove('hidden');
        document.getElementById('currentEpisode').textContent = `ตอนที่ ${this.state.currentEpisode}`;

        try {
            // Load drama info and chapters
            const [detail, chapters, video] = await Promise.all([
                API.getDramaDetail(this.state.bookId),
                API.getChapters(this.state.bookId),
                API.getVideoUrl(this.state.bookId, this.state.currentEpisode)
            ]);

            const dramaData = detail?.drama || detail?.data || detail || {};
            this.state.dramaData = dramaData;

            // Check if favorited
            this.state.isFavorite = Favorites.isFavorite(this.state.bookId);
            document.getElementById('infoFavBtn')?.classList.toggle('active', this.state.isFavorite);

            // Get cover from dramaData.chapterList
            let coverFromChapter = '';
            if (dramaData.chapterList && dramaData.chapterList.length > 0) {
                coverFromChapter = dramaData.chapterList[0]?.chapterImg || '';
            }

            const chapterCount = dramaData.chapterCount || 0;

            // Generate full chapter list from chapterCount
            let chapterList = [];
            if (chapterCount > 0) {
                chapterList = Array.from({ length: chapterCount }, (_, i) => ({ chapterIndex: i }));
            } else if (Array.isArray(chapters)) {
                chapterList = chapters;
            } else if (chapters?.chapterList) {
                chapterList = chapters.chapterList;
            } else if (chapters?.list) {
                chapterList = chapters.list;
            } else if (chapters?.chapters) {
                chapterList = chapters.chapters;
            } else if (chapters?.data) {
                chapterList = chapters.data;
            }

            this.state.chapters = chapterList;

            // Get cover
            let cover = dramaData.cover || coverFromChapter;

            // Update titles
            const title = dramaData.bookName || 'กำลังเล่น...';
            document.getElementById('watchTitle').textContent = title;
            document.getElementById('videoTitle2').textContent = title;
            document.getElementById('episodeBadge').textContent = `ตอนที่ ${this.state.currentEpisode}`;

            // Update description
            const desc = dramaData.introduction || dramaData.description || 'ไม่มีเรื่องย่อ';
            document.getElementById('videoDesc').textContent = desc;

            // Save to watch history
            WatchHistory.add({
                bookId: this.state.bookId,
                bookName: dramaData.bookName || 'Unknown',
                cover: cover,
                lastEpisode: this.state.currentEpisode,
                totalEpisodes: chapterCount,
                progress: 0
            });

            // Load video
            const videoUrl = video.url || video.videoUrl || video;
            this.loadVideo(videoUrl);

            // Render episode list
            this.renderEpisodeList();
            this.updateEpisodeNav();

        } catch (error) {
            console.error('Watch error:', error);
            Common.showError('ไม่สามารถโหลดวิดีโอได้');
        }
    },

    // ========================================
    // Video Loading (iOS HLS Compatible)
    // ========================================

    loadVideo(url) {
        const video = document.getElementById('videoPlayer');
        const loading = document.getElementById('videoLoading');
        const overlay = document.getElementById('playOverlay');

        // Destroy existing HLS instance if any
        if (this.state.hls) {
            this.state.hls.destroy();
            this.state.hls = null;
        }

        // Reset video state
        video.removeAttribute('src');
        video.load();
        video.onerror = null;

        // Detect if URL is HLS (.m3u8) or MP4
        const isHLS = url.toLowerCase().includes('.m3u8') ||
            url.toLowerCase().includes('m3u8') ||
            (url.includes('playlist') && !url.includes('.mp4'));
        const isMP4 = url.toLowerCase().includes('.mp4');

        console.log('[VideoPlayer] Loading:', url);
        console.log('[VideoPlayer] IsHLS:', isHLS, 'IsMP4:', isMP4, 'IsIOS:', this.state.isIOS);

        // ===== iOS: Always use native HLS support =====
        if (this.state.isIOS || (isHLS && video.canPlayType('application/vnd.apple.mpegurl'))) {
            console.log('[VideoPlayer] Using native HLS support (iOS/Safari)');

            video.src = url;

            const onCanPlay = () => {
                console.log('[VideoPlayer] Native HLS ready to play');
                loading?.classList.add('hidden');

                // On iOS, show play overlay instead of auto-playing
                if (this.state.isIOS) {
                    overlay?.classList.remove('hidden');
                } else {
                    video.play().catch(e => {
                        console.log('[VideoPlayer] Autoplay blocked:', e);
                        overlay?.classList.remove('hidden');
                    });
                }
            };

            const onError = (e) => {
                console.error('[VideoPlayer] Native HLS error:', video.error);
                loading?.classList.add('hidden');
                overlay?.classList.remove('hidden');

                // Show user-friendly error
                const errorCode = video.error?.code;
                if (errorCode === 2) {
                    Common.showError('เกิดข้อผิดพลาดเครือข่าย กรุณาลองใหม่');
                } else if (errorCode === 3) {
                    Common.showError('รูปแบบวิดีโอไม่รองรับ');
                } else if (errorCode === 4) {
                    Common.showError('ไม่พบไฟล์วิดีโอ');
                } else {
                    Common.showError('ไม่สามารถโหลดวิดีโอได้');
                }
            };

            video.addEventListener('canplay', onCanPlay, { once: true });
            video.addEventListener('loadedmetadata', () => {
                console.log('[VideoPlayer] Metadata loaded, duration:', video.duration);
            }, { once: true });
            video.addEventListener('error', onError, { once: true });

            // ===== Desktop: Use HLS.js for .m3u8 streams =====
        } else if (isHLS && typeof Hls !== 'undefined' && Hls.isSupported()) {
            console.log('[VideoPlayer] Using HLS.js for HLS stream');

            this.state.hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                enableWorker: true,
                lowLatencyMode: false
            });

            this.state.hls.loadSource(url);
            this.state.hls.attachMedia(video);

            this.state.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('[VideoPlayer] HLS Manifest parsed');
                loading?.classList.add('hidden');
                video.play().catch(e => {
                    console.log('[VideoPlayer] Autoplay blocked:', e);
                    overlay?.classList.remove('hidden');
                });
            });

            this.state.hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('[VideoPlayer] HLS Error:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('[VideoPlayer] Network error, trying to recover...');
                            this.state.hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('[VideoPlayer] Media error, trying to recover...');
                            this.state.hls.recoverMediaError();
                            break;
                        default:
                            console.error('[VideoPlayer] Fatal error, cannot recover');
                            loading?.classList.add('hidden');
                            overlay?.classList.remove('hidden');
                            Common.showError('ไม่สามารถโหลดวิดีโอได้');
                            break;
                    }
                }
            });

            // ===== HTML5 Native for MP4 =====
        } else {
            console.log('[VideoPlayer] Using HTML5 Native for MP4');
            video.src = url;

            video.addEventListener('canplay', () => {
                console.log('[VideoPlayer] MP4 ready to play');
                loading?.classList.add('hidden');
                video.play().catch(e => {
                    console.log('[VideoPlayer] Autoplay blocked:', e);
                    overlay?.classList.remove('hidden');
                });
            }, { once: true });

            video.onerror = () => {
                console.error('[VideoPlayer] MP4 error:', video.error);
                loading?.classList.add('hidden');
                overlay?.classList.remove('hidden');
                Common.showError('ไม่สามารถโหลดวิดีโอได้');
            };
        }
    },

    // ========================================
    // Episode Switching (SPA-style)
    // ========================================

    async switchEpisode(ep) {
        if (ep < 1 || ep > this.state.chapters.length) return;

        // Show loading
        document.getElementById('videoLoading')?.classList.remove('hidden');
        document.getElementById('playOverlay')?.classList.add('hidden');

        // Update state
        this.state.currentEpisode = ep;

        // Update URL without reload
        window.history.pushState({}, '', `watch.html?id=${this.state.bookId}&ep=${ep}`);

        // Update UI
        document.getElementById('currentEpisode').textContent = `ตอนที่ ${ep}`;
        const title = this.state.dramaData?.bookName || 'กำลังเล่น...';
        document.getElementById('watchTitle').textContent = title;

        // Update info panel
        document.getElementById('episodeBadge').textContent = `ตอนที่ ${ep}`;

        // Update episode list active state
        const dropdown = document.getElementById('episodeSelect');
        if (dropdown) {
            dropdown.value = ep;
        }

        // Update player status
        this.updatePlayerStatus(`กำลังโหลด ตอนที่ ${ep}...`);

        // Update nav buttons
        this.updateEpisodeNav();

        // Load new video
        try {
            const video = await API.getVideoUrl(this.state.bookId, ep);
            const videoUrl = video.url || video.videoUrl || video;
            this.loadVideo(videoUrl);

            // Update watch history
            WatchHistory.update(this.state.bookId, {
                lastEpisode: ep,
                progress: 0
            });
        } catch (error) {
            console.error('Error loading episode:', error);
            Common.showError('ไม่สามารถโหลดตอนนี้ได้');
        }
    },

    renderEpisodeList() {
        const dropdown = document.getElementById('episodeSelect');
        if (!dropdown) return;

        // Render dropdown options
        dropdown.innerHTML = this.state.chapters.map((ch, i) => {
            const epNum = (ch.chapterIndex !== undefined ? ch.chapterIndex : i) + 1;
            return `<option value="${epNum}" ${epNum === this.state.currentEpisode ? 'selected' : ''}>ตอนที่ ${epNum}</option>`;
        }).join('');

        // Add change handler
        dropdown.onchange = () => {
            const ep = parseInt(dropdown.value);
            this.switchEpisode(ep);
        };

        // Update status
        this.updatePlayerStatus(`กำลังเล่น ตอนที่ ${this.state.currentEpisode}/${this.state.chapters.length}`);
    },

    updatePlayerStatus(message, type = '') {
        const status = document.getElementById('playerStatus');
        if (status) {
            status.textContent = message;
            status.className = 'player-status' + (type ? ` ${type}` : '');
        }
    },

    updateEpisodeNav() {
        const prev = document.getElementById('prevEpisodeBtn');
        const next = document.getElementById('nextEpisodeBtn');
        const total = this.state.chapters.length;

        if (prev) {
            prev.disabled = this.state.currentEpisode <= 1;
            prev.onclick = () => {
                if (this.state.currentEpisode > 1) {
                    this.switchEpisode(this.state.currentEpisode - 1);
                }
            };
        }

        if (next) {
            next.disabled = this.state.currentEpisode >= total;
            next.onclick = () => {
                if (this.state.currentEpisode < total) {
                    this.switchEpisode(this.state.currentEpisode + 1);
                }
            };
        }
    },

    // ========================================
    // Video Player Controls
    // ========================================

    initVideoPlayer() {
        const video = document.getElementById('videoPlayer');
        const playPause = document.getElementById('playPauseBtn');
        const progress = document.getElementById('progressBar');
        const progressCurrent = document.getElementById('progressCurrent');
        const currentTime = document.getElementById('currentTime');
        const duration = document.getElementById('duration');
        const fullscreen = document.getElementById('fullscreenBtn');
        const volume = document.getElementById('volumeSlider');
        const mute = document.getElementById('muteBtn');
        const skipBack = document.getElementById('skipBackBtn');
        const skipForward = document.getElementById('skipForwardBtn');
        const speedBtn = document.getElementById('speedBtn');

        // โหลด volume ที่บันทึกไว้
        const savedVolume = VideoSettings.getVolume();
        if (video) video.volume = savedVolume;
        if (volume) volume.value = savedVolume;

        // โหลดความเร็วที่บันทึกไว้
        const savedSpeed = VideoSettings.getSpeed();
        if (video) video.playbackRate = savedSpeed;
        this.updateSpeedDisplay(savedSpeed);

        playPause?.addEventListener('click', () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });

        video?.addEventListener('timeupdate', () => {
            const pct = (video.currentTime / video.duration) * 100;
            if (progressCurrent) progressCurrent.style.width = `${pct}%`;
            if (currentTime) currentTime.textContent = Common.formatTime(video.currentTime);

            // บันทึก progress
            if (video.duration > 0) {
                const progressVal = video.currentTime / video.duration;
                WatchHistory.update(this.state.bookId, {
                    progress: progressVal,
                    lastEpisode: this.state.currentEpisode
                });
            }
        });

        video?.addEventListener('loadedmetadata', () => {
            if (duration) duration.textContent = Common.formatTime(video.duration);
        });

        video?.addEventListener('play', () => {
            if (playPause) playPause.innerHTML = '<i class="fas fa-pause"></i>';
            document.getElementById('playOverlay')?.classList.add('hidden');
        });

        video?.addEventListener('pause', () => {
            if (playPause) playPause.innerHTML = '<i class="fas fa-play"></i>';
        });

        // แสดงข้อความเมื่อวิดีโอจบ
        video?.addEventListener('ended', () => {
            document.getElementById('playOverlay')?.classList.remove('hidden');
            if (this.state.currentEpisode >= this.state.chapters.length) {
                this.updatePlayerStatus('🎉 ดูจบทุกตอนแล้ว!', 'success');
            } else {
                this.updatePlayerStatus('ตอนจบแล้ว กรุณาเลือกตอนถัดไป', 'success');
            }
        });

        progress?.addEventListener('click', (e) => {
            const rect = progress.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * video.duration;
        });

        // Fullscreen button
        fullscreen?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        volume?.addEventListener('input', (e) => {
            video.volume = e.target.value;
            VideoSettings.setVolume(parseFloat(e.target.value));
            mute.innerHTML = video.volume === 0 ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        });

        mute?.addEventListener('click', () => {
            video.muted = !video.muted;
            mute.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        });

        skipBack?.addEventListener('click', () => {
            video.currentTime = Math.max(0, video.currentTime - 10);
        });

        skipForward?.addEventListener('click', () => {
            video.currentTime = Math.min(video.duration, video.currentTime + 10);
        });

        // ปรับความเร็ววิดีโอ
        speedBtn?.addEventListener('click', () => {
            this.showSpeedSelector();
        });
    },

    updateSpeedDisplay(speed) {
        const speedBtn = document.getElementById('speedBtn');
        if (speedBtn) {
            speedBtn.textContent = speed === 1 ? '1x' : `${speed}x`;
        }
    },

    showSpeedSelector() {
        const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        const currentSpeed = VideoSettings.getSpeed();

        Swal.fire({
            title: 'ความเร็วในการเล่น',
            html: speeds.map(s => `
                <button class="speed-option ${s === currentSpeed ? 'active' : ''}" data-speed="${s}" style="
                    padding: 12px 24px;
                    margin: 5px;
                    border: 1px solid ${s === currentSpeed ? '#ff4757' : 'rgba(255,255,255,0.2)'};
                    background: ${s === currentSpeed ? 'rgba(255, 71, 87, 0.2)' : 'transparent'};
                    color: ${s === currentSpeed ? '#ff4757' : 'white'};
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 14px;
                ">${s}x</button>
            `).join(''),
            showConfirmButton: false,
            showCloseButton: true,
            background: '#1a1a1a',
            color: '#fff',
            didOpen: () => {
                document.querySelectorAll('.speed-option').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const speed = parseFloat(btn.dataset.speed);
                        const video = document.getElementById('videoPlayer');
                        video.playbackRate = speed;
                        VideoSettings.setSpeed(speed);
                        this.updateSpeedDisplay(speed);
                        Swal.close();
                    });
                });
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => WatchPage.init());
