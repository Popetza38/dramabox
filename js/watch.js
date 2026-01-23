/**
 * DramaPop Watch Page JavaScript
 * SPA-style episode switching (no page reload, keeps fullscreen)
 */

const WatchPage = {
    state: {
        bookId: null,
        currentEpisode: 1,
        chapters: [],
        hls: null,
        dramaData: null,
        isFullscreen: false
    },

    async init() {
        Common.init();
        this.state.bookId = Common.getUrlParam('id');
        this.state.currentEpisode = parseInt(Common.getUrlParam('ep')) || 1;

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

        // Video controls
        this.initVideoPlayer();

        // Track fullscreen changes
        document.addEventListener('fullscreenchange', () => {
            this.state.isFullscreen = !!document.fullscreenElement;
        });
    },

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

            // Update title
            const title = dramaData.bookName || 'กำลังเล่น...';
            document.getElementById('watchTitle').textContent = `${title} - ตอนที่ ${this.state.currentEpisode}`;

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

    loadVideo(url) {
        const video = document.getElementById('videoPlayer');
        const loading = document.getElementById('videoLoading');

        // Destroy existing HLS instance if any
        if (this.state.hls) {
            this.state.hls.destroy();
            this.state.hls = null;
        }

        // Remove any existing error listeners
        video.onerror = null;

        // Detect if URL is HLS (.m3u8) or MP4
        const isHLS = url.toLowerCase().includes('.m3u8') ||
            url.toLowerCase().includes('m3u8') ||
            url.includes('playlist') && !url.includes('.mp4');
        const isMP4 = url.toLowerCase().includes('.mp4') ||
            url.toLowerCase().endsWith('.mp4');

        console.log('[VideoPlayer] Loading:', url);
        console.log('[VideoPlayer] IsHLS:', isHLS, 'IsMP4:', isMP4);

        if (isHLS && Hls.isSupported()) {
            // ===== HLS.js for .m3u8 streams =====
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
                console.log('[VideoPlayer] HLS Manifest parsed, starting playback');
                video.play().catch(e => console.log('[VideoPlayer] Autoplay blocked:', e));
                loading?.classList.add('hidden');
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
                            Common.showError('ไม่สามารถโหลดวิดีโอได้');
                            break;
                    }
                }
            });

        } else if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
            // ===== Native HLS support (Safari/iOS) =====
            console.log('[VideoPlayer] Using native HLS support');
            video.src = url;

            video.addEventListener('loadedmetadata', () => {
                console.log('[VideoPlayer] Native HLS loaded');
                video.play().catch(e => console.log('[VideoPlayer] Autoplay blocked:', e));
                loading?.classList.add('hidden');
            }, { once: true });

            video.onerror = () => {
                console.error('[VideoPlayer] Native HLS error');
                loading?.classList.add('hidden');
                Common.showError('ไม่สามารถโหลดวิดีโอได้');
            };

        } else {
            // ===== HTML5 Native for MP4 =====
            console.log('[VideoPlayer] Using HTML5 Native for MP4');
            video.src = url;

            video.addEventListener('loadeddata', () => {
                console.log('[VideoPlayer] MP4 loaded successfully');
                video.play().catch(e => console.log('[VideoPlayer] Autoplay blocked:', e));
                loading?.classList.add('hidden');
            }, { once: true });

            video.addEventListener('canplay', () => {
                console.log('[VideoPlayer] MP4 can play');
                loading?.classList.add('hidden');
            }, { once: true });

            video.onerror = (e) => {
                console.error('[VideoPlayer] MP4 error:', e);
                loading?.classList.add('hidden');
                Common.showError('ไม่สามารถโหลดวิดีโอได้');
            };
        }
    },

    // Switch episode without page reload (SPA-style)
    async switchEpisode(ep) {
        if (ep < 1 || ep > this.state.chapters.length) return;

        // Show loading
        document.getElementById('videoLoading')?.classList.remove('hidden');

        // Update state
        this.state.currentEpisode = ep;

        // Update URL without reload
        window.history.pushState({}, '', `watch.html?id=${this.state.bookId}&ep=${ep}`);

        // Update UI
        document.getElementById('currentEpisode').textContent = `ตอนที่ ${ep}`;
        const title = this.state.dramaData?.bookName || 'กำลังเล่น...';
        document.getElementById('watchTitle').textContent = `${title} - ตอนที่ ${ep}`;

        // Update episode list active state
        document.querySelectorAll('.episode-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.index) === ep);
        });

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
        const container = document.getElementById('episodeList');
        container.innerHTML = this.state.chapters.map((ch, i) => {
            const epNum = (ch.chapterIndex !== undefined ? ch.chapterIndex : i) + 1;
            return `<button class="episode-btn ${epNum === this.state.currentEpisode ? 'active' : ''}" 
                    data-index="${epNum}">ตอนที่ ${epNum}</button>`;
        }).join('');

        container.querySelectorAll('.episode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ep = parseInt(btn.dataset.index);
                this.switchEpisode(ep);
            });
        });

        // Scroll to active episode
        const activeBtn = container.querySelector('.episode-btn.active');
        if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    },

    updateEpisodeNav() {
        const prev = document.getElementById('prevEpisodeBtn');
        const next = document.getElementById('nextEpisodeBtn');
        const total = this.state.chapters.length;

        prev.disabled = this.state.currentEpisode <= 1;
        next.disabled = this.state.currentEpisode >= total;

        prev.onclick = () => {
            if (this.state.currentEpisode > 1) {
                this.switchEpisode(this.state.currentEpisode - 1);
            }
        };

        next.onclick = () => {
            if (this.state.currentEpisode < total) {
                this.switchEpisode(this.state.currentEpisode + 1);
            }
        };
    },

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
        });

        video?.addEventListener('pause', () => {
            if (playPause) playPause.innerHTML = '<i class="fas fa-play"></i>';
        });

        // Auto play next episode when current ends
        video?.addEventListener('ended', () => {
            if (this.state.currentEpisode < this.state.chapters.length) {
                this.switchEpisode(this.state.currentEpisode + 1);
            }
        });

        progress?.addEventListener('click', (e) => {
            const rect = progress.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * video.duration;
        });

        fullscreen?.addEventListener('click', () => {
            const container = document.getElementById('videoContainer');

            // iOS Safari: ใช้ webkitEnterFullscreen บน video element โดยตรง
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

            if (isIOS && video.webkitEnterFullscreen) {
                // iOS ต้องใช้ video.webkitEnterFullscreen() โดยตรง
                video.webkitEnterFullscreen();
            } else if (document.fullscreenElement || document.webkitFullscreenElement) {
                // ออกจาก fullscreen
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            } else {
                // เข้า fullscreen
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                }
            }
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
