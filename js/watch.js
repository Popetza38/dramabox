/**
 * DramaBox - Watch Page Script
 * หน้าดูวิดีโอ - Fixed Version
 */

let currentDrama = null;
let chapters = [];
let currentEpisodeIndex = 0;
let hls = null;
let controlsTimeout = null;

// WATCH_HISTORY_KEY is defined in main.js

document.addEventListener('DOMContentLoaded', () => {
    initWatchPage();
    setupVideoEvents();
    setupVideoControls();
});

/**
 * Initialize Watch Page
 */
async function initWatchPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    const episodeId = urlParams.get('ep');
    const episodeIndex = parseInt(urlParams.get('index')) || 0;

    if (!bookId) {
        showError('ไม่พบข้อมูลวิดีโอ');
        return;
    }

    currentEpisodeIndex = episodeIndex;
    showVideoLoading(true);

    try {
        // Load drama info from cache
        currentDrama = getCachedDrama(bookId) || { bookId: bookId };

        // Fetch chapters from API
        console.log('Fetching chapters for bookId:', bookId);
        const chaptersData = await DramaAPI.getChapters(bookId);
        chapters = chaptersData.data || [];
        console.log('Loaded chapters:', chapters.length);

        if (chapters.length === 0) {
            throw new Error('No chapters found');
        }

        // Render UI
        renderWatchInfo();
        renderEpisodeList();

        // Check for continue watching
        checkContinueWatching();

        // Get current episode
        const currentEp = chapters[currentEpisodeIndex];
        console.log('Current episode:', currentEp);

        if (currentEp) {
            // Try videoPath first, then fall back to API call
            if (currentEp.videoPath) {
                console.log('Playing from videoPath:', currentEp.videoPath);
                await playVideoUrl(currentEp.videoPath);
            } else if (episodeId) {
                console.log('Loading video from stream API for episodeId:', episodeId);
                await loadVideo(episodeId);
            } else {
                console.log('No videoPath, trying with chapterId');
                const chapterId = currentEp.chapterId || currentEp.id;
                if (chapterId) {
                    await loadVideo(chapterId);
                } else {
                    throw new Error('No video source found');
                }
            }
        } else {
            throw new Error('Episode not found');
        }

        showVideoLoading(false);

        // Start saving progress
        startProgressSaving();

    } catch (error) {
        console.error('Failed to load video:', error);
        showVideoLoading(false);
        showToast('ไม่สามารถโหลดวิดีโอได้: ' + error.message, 'error');
    }
}

/**
 * Get cached drama data
 */
function getCachedDrama(bookId) {
    try {
        const cache = sessionStorage.getItem('dramaCache');
        if (cache) {
            const dramas = JSON.parse(cache);
            return dramas.find(d => (d.bookId || d.id) == bookId);
        }
    } catch (e) {
        console.error('Cache error:', e);
    }
    return null;
}

/**
 * Play video from URL
 */
async function playVideoUrl(url) {
    const video = document.getElementById('video-player');
    if (!video) return;

    showVideoLoading(true);

    try {
        // Destroy existing HLS
        if (hls) {
            hls.destroy();
            hls = null;
        }

        if (url.includes('.m3u8')) {
            // HLS Stream
            if (Hls.isSupported()) {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(url);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, async () => {
                    console.log('HLS manifest parsed, starting playback');
                    try {
                        await video.play();
                    } catch (e) {
                        console.log('Autoplay blocked:', e);
                    }
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS Error:', data);
                    if (data.fatal) {
                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            hls.startLoad();
                        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            hls.recoverMediaError();
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari native HLS
                video.src = url;
                await video.play();
            }
        } else {
            // Direct video (MP4)
            video.src = url;
            video.load();
            try {
                await video.play();
            } catch (e) {
                console.log('Autoplay blocked:', e);
            }
        }

        showVideoLoading(false);
    } catch (error) {
        console.error('Playback error:', error);
        showVideoLoading(false);
        showToast('ไม่สามารถเล่นวิดีโอได้', 'error');
    }
}

/**
 * Load Video via Stream API
 */
async function loadVideo(itemId) {
    const video = document.getElementById('video-player');
    if (!video) return;

    showVideoLoading(true);

    try {
        console.log('Fetching stream URL for itemId:', itemId);
        const streamData = await DramaAPI.getStreamUrl(itemId);
        console.log('Stream data:', streamData);

        const streamUrl = streamData.data?.playUrl || streamData.data?.url || streamData.data?.videoPath;

        if (!streamUrl) {
            throw new Error('No stream URL in response');
        }

        console.log('Playing stream URL:', streamUrl);
        await playVideoUrl(streamUrl);

    } catch (error) {
        console.error('Failed to load stream:', error);
        showVideoLoading(false);
        showToast('ไม่สามารถโหลดวิดีโอได้', 'error');
    }
}

/**
 * Render Watch Info
 */
function renderWatchInfo() {
    const nameEl = document.getElementById('watch-name');
    const episodeEl = document.getElementById('watch-episode');

    const bookInfo = currentDrama?.bookInfo || currentDrama;
    const name = bookInfo?.bookName || bookInfo?.name || 'กำลังโหลด...';
    const epNumber = currentEpisodeIndex + 1;

    if (nameEl) nameEl.textContent = name;
    if (episodeEl) episodeEl.textContent = `ตอนที่ ${epNumber}`;

    document.title = `${name} ตอนที่ ${epNumber} - DramaBox`;

    updateNavButtons();
}

/**
 * Update Navigation Buttons
 */
function updateNavButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) {
        prevBtn.disabled = currentEpisodeIndex <= 0;
        prevBtn.classList.toggle('disabled', currentEpisodeIndex <= 0);
    }

    if (nextBtn) {
        nextBtn.disabled = currentEpisodeIndex >= chapters.length - 1;
        nextBtn.classList.toggle('disabled', currentEpisodeIndex >= chapters.length - 1);
    }
}

/**
 * Render Episode List
 */
function renderEpisodeList() {
    const container = document.getElementById('episode-list');
    if (!container) return;

    if (chapters.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:1rem;">ไม่พบรายการตอน</p>';
        return;
    }

    container.innerHTML = chapters.map((ep, index) => {
        const epNumber = ep.chapterIndex !== undefined ? ep.chapterIndex + 1 : (index + 1);
        const chapterId = ep.chapterId || ep.id || ep.itemId;
        const isActive = index === currentEpisodeIndex;

        return `
            <button class="episode-card ${isActive ? 'active' : ''}" 
                    data-chapter-id="${chapterId}"
                    data-index="${index}"
                    onclick="changeEpisode('${chapterId}', ${index})">
                <span class="episode-number">${epNumber}</span>
                <span class="episode-label">ตอน</span>
            </button>
        `;
    }).join('');

    // Scroll to active
    setTimeout(() => {
        const activeBtn = container.querySelector('.active');
        if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

/**
 * Change Episode
 */
async function changeEpisode(chapterId, index) {
    if (index === currentEpisodeIndex) return;

    saveWatchProgress();
    showVideoLoading(true);

    currentEpisodeIndex = index;

    const bookId = currentDrama?.bookId || currentDrama?.id || new URLSearchParams(window.location.search).get('id');
    const newUrl = `watch.html?id=${bookId}&ep=${chapterId}&index=${index}`;
    window.history.pushState({}, '', newUrl);

    renderWatchInfo();
    renderEpisodeList();

    // Hide continue banner
    const banner = document.getElementById('continue-banner');
    if (banner) banner.classList.remove('show');

    // Play new episode
    const currentEp = chapters[index];
    if (currentEp && currentEp.videoPath) {
        await playVideoUrl(currentEp.videoPath);
    } else {
        await loadVideo(chapterId);
    }

    showVideoLoading(false);
}

/**
 * Play Previous/Next Episode
 */
function playPrev() {
    if (currentEpisodeIndex > 0) {
        const ep = chapters[currentEpisodeIndex - 1];
        const chapterId = ep.chapterId || ep.id || ep.itemId;
        changeEpisode(chapterId, currentEpisodeIndex - 1);
    }
}

function playNext() {
    if (currentEpisodeIndex < chapters.length - 1) {
        const ep = chapters[currentEpisodeIndex + 1];
        const chapterId = ep.chapterId || ep.id || ep.itemId;
        changeEpisode(chapterId, currentEpisodeIndex + 1);
    }
}

/**
 * Video Controls
 */
function setupVideoControls() {
    const video = document.getElementById('video-player');
    const wrapper = document.getElementById('video-wrapper');
    const overlay = document.getElementById('video-overlay');
    const header = document.getElementById('watch-header');

    if (!video || !wrapper) return;

    let isMouseOverControls = false;

    // Start with controls hidden
    hideControls();

    wrapper.addEventListener('mousemove', showControls);
    wrapper.addEventListener('mouseenter', showControls);
    wrapper.addEventListener('mouseleave', () => {
        if (!video.paused) {
            hideControls();
        }
    });

    wrapper.addEventListener('touchstart', () => {
        if (overlay?.classList.contains('show')) {
            hideControls();
        } else {
            showControls();
        }
    });

    wrapper.addEventListener('dblclick', () => toggleFullscreen(video));

    // Clicking on overlay controls should not hide them
    if (overlay) {
        overlay.addEventListener('mouseenter', () => {
            isMouseOverControls = true;
            clearTimeout(controlsTimeout);
        });
        overlay.addEventListener('mouseleave', () => {
            isMouseOverControls = false;
            if (!video.paused) {
                controlsTimeout = setTimeout(hideControls, 2000);
            }
        });
    }

    video.addEventListener('timeupdate', updateProgressBar);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('progress', updateBufferedBar);
    video.addEventListener('play', () => {
        updatePlayPauseIcon(true);
        // Auto-hide controls when video starts playing
        controlsTimeout = setTimeout(() => {
            if (!isMouseOverControls) hideControls();
        }, 2000);
    });
    video.addEventListener('pause', () => {
        updatePlayPauseIcon(false);
        // Show controls when paused
        showControls();
        clearTimeout(controlsTimeout);
    });
    video.addEventListener('waiting', () => showVideoLoading(true));
    video.addEventListener('canplay', () => showVideoLoading(false));

    function showControls() {
        if (overlay) overlay.classList.add('show');
        if (header) header.classList.remove('hidden');
        clearTimeout(controlsTimeout);
        if (!video.paused && !isMouseOverControls) {
            controlsTimeout = setTimeout(hideControls, 3000);
        }
    }

    function hideControls() {
        if (overlay) overlay.classList.remove('show');
        if (header) header.classList.add('hidden');
    }

    // Export for use elsewhere
    window.showVideoControls = showControls;
    window.hideVideoControls = hideControls;
}

/**
 * Progress Bar Functions
 */
function updateProgressBar() {
    const video = document.getElementById('video-player');
    const playedBar = document.getElementById('played-bar');
    const handle = document.getElementById('progress-handle');
    const currentTimeEl = document.getElementById('current-time');

    if (!video || !playedBar) return;

    const percent = (video.currentTime / video.duration) * 100 || 0;
    playedBar.style.width = `${percent}%`;
    if (handle) handle.style.left = `${percent}%`;
    if (currentTimeEl) currentTimeEl.textContent = formatTime(video.currentTime);
}

function updateBufferedBar() {
    const video = document.getElementById('video-player');
    const bufferedBar = document.getElementById('buffered-bar');

    if (!video || !bufferedBar || video.buffered.length === 0) return;

    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    const percent = (bufferedEnd / video.duration) * 100;
    bufferedBar.style.width = `${percent}%`;
}

function updateDuration() {
    const video = document.getElementById('video-player');
    const durationEl = document.getElementById('duration');

    if (!video || !durationEl) return;
    durationEl.textContent = formatTime(video.duration);
    checkContinueWatching();
}

function updatePlayPauseIcon(isPlaying) {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = document.getElementById('play-icon');

    if (playPauseBtn) {
        playPauseBtn.innerHTML = isPlaying
            ? '<i data-lucide="pause" style="width:32px;height:32px"></i>'
            : '<i data-lucide="play" style="width:32px;height:32px"></i>';
    }

    if (playIcon) {
        playIcon.setAttribute('data-lucide', isPlaying ? 'pause' : 'play');
    }

    if (window.lucide) lucide.createIcons();
}

/**
 * Video Control Functions
 */
function togglePlay() {
    const video = document.getElementById('video-player');
    if (video) video.paused ? video.play() : video.pause();
}

function skipTime(seconds) {
    const video = document.getElementById('video-player');
    if (video) video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
}

function seekTo(event) {
    const video = document.getElementById('video-player');
    const progressBar = document.getElementById('progress-bar');
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
}

function changeVolume(value) {
    const video = document.getElementById('video-player');
    if (video) {
        video.volume = parseFloat(value);
        updateVolumeIcon();
    }
}

function toggleMute() {
    const video = document.getElementById('video-player');
    if (video) {
        video.muted = !video.muted;
        updateVolumeIcon();
    }
}

function updateVolumeIcon() {
    const video = document.getElementById('video-player');
    const volumeIcon = document.getElementById('volume-icon');
    const volumeSlider = document.getElementById('volume-slider');

    if (!video || !volumeIcon) return;

    let iconName = 'volume-2';
    if (video.muted || video.volume === 0) iconName = 'volume-x';
    else if (video.volume < 0.5) iconName = 'volume-1';

    volumeIcon.setAttribute('data-lucide', iconName);
    if (volumeSlider) volumeSlider.value = video.muted ? 0 : video.volume;
    if (window.lucide) lucide.createIcons();
}

async function togglePIP() {
    const video = document.getElementById('video-player');
    if (!video) return;

    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else if (document.pictureInPictureEnabled) {
            await video.requestPictureInPicture();
        }
    } catch (error) {
        showToast('ไม่สามารถเปิด Picture-in-Picture ได้', 'error');
    }
}

function toggleFullscreen(element) {
    if (!document.fullscreenElement) {
        (element || document.getElementById('video-player')).requestFullscreen().catch(() => { });
    } else {
        document.exitFullscreen();
    }
}

/**
 * Utility Functions
 */
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showVideoLoading(show) {
    const loader = document.getElementById('video-loading');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

/**
 * Watch History Functions
 */
function getWatchHistory() {
    try {
        const history = localStorage.getItem(WATCH_HISTORY_KEY);
        return history ? JSON.parse(history) : {};
    } catch (e) {
        return {};
    }
}

function saveWatchProgress() {
    const video = document.getElementById('video-player');
    if (!video || !currentDrama) return;

    const bookId = currentDrama?.bookId || currentDrama?.id || new URLSearchParams(window.location.search).get('id');
    if (!bookId) return;

    const currentEp = chapters[currentEpisodeIndex];
    if (!currentEp) return;

    try {
        const history = getWatchHistory();

        history[bookId] = {
            bookId: bookId,
            bookName: currentDrama?.bookInfo?.bookName || currentDrama?.bookName || currentDrama?.name || '',
            cover: currentDrama?.bookInfo?.coverWap || currentDrama?.cover || currentDrama?.coverWap || '',
            episodeIndex: currentEpisodeIndex,
            chapterId: currentEp.chapterId || currentEp.id || currentEp.itemId,
            currentTime: video.currentTime,
            duration: video.duration || 0,
            progress: video.duration ? (video.currentTime / video.duration * 100) : 0,
            lastWatched: Date.now(),
            watchedEpisodes: history[bookId]?.watchedEpisodes || []
        };

        if (video.duration && video.currentTime / video.duration > 0.8) {
            if (!history[bookId].watchedEpisodes.includes(currentEpisodeIndex)) {
                history[bookId].watchedEpisodes.push(currentEpisodeIndex);
            }
        }

        localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error('Failed to save progress:', e);
    }
}

function getCurrentDramaProgress() {
    const bookId = currentDrama?.bookId || currentDrama?.id || new URLSearchParams(window.location.search).get('id');
    if (!bookId) return null;
    const history = getWatchHistory();
    return history[bookId] || null;
}

function checkContinueWatching() {
    const progress = getCurrentDramaProgress();
    const banner = document.getElementById('continue-banner');
    const timeEl = document.getElementById('continue-time');

    if (!banner) return;

    if (progress && progress.episodeIndex === currentEpisodeIndex && progress.currentTime > 10) {
        banner.classList.add('show');
        if (timeEl) timeEl.textContent = formatTime(progress.currentTime);
    } else {
        banner.classList.remove('show');
    }
}

function resumeFromHistory() {
    const progress = getCurrentDramaProgress();
    const video = document.getElementById('video-player');
    const banner = document.getElementById('continue-banner');

    if (progress && video && progress.currentTime > 0) {
        video.currentTime = progress.currentTime;
        if (banner) banner.classList.remove('show');
        showToast(`กลับมาดูต่อที่ ${formatTime(progress.currentTime)}`, 'info');
    }
}

function startProgressSaving() {
    setInterval(saveWatchProgress, 5000);
    window.addEventListener('beforeunload', saveWatchProgress);
}

/**
 * Video Events
 */
function setupVideoEvents() {
    const video = document.getElementById('video-player');
    if (!video) return;

    video.addEventListener('ended', () => {
        saveWatchProgress();

        if (currentEpisodeIndex < chapters.length - 1) {
            // Auto-play next episode
            showToast('กำลังเล่นตอนถัดไป...', 'info');
            setTimeout(() => playNext(), 1500);
        } else {
            showToast('จบซีรีส์แล้ว! 🎉', 'success');
        }
    });

    video.addEventListener('error', (e) => {
        console.error('Video error:', e);
        showToast('เกิดข้อผิดพลาดในการเล่นวิดีโอ', 'error');
    });
}

/**
 * Keyboard Controls
 */
document.addEventListener('keydown', (e) => {
    const video = document.getElementById('video-player');
    if (!video) return;

    switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': skipTime(-10); break;
        case 'ArrowRight': skipTime(10); break;
        case 'ArrowUp': e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); updateVolumeIcon(); break;
        case 'ArrowDown': e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); updateVolumeIcon(); break;
        case 'f': case 'F': toggleFullscreen(video); break;
        case 'm': case 'M': toggleMute(); break;
        case 'n': case 'N': playNext(); break;
        case 'p': case 'P': playPrev(); break;
    }
});

/**
 * Navigation
 */
function goBack() {
    saveWatchProgress();
    const bookId = currentDrama?.bookId || currentDrama?.id || new URLSearchParams(window.location.search).get('id');
    window.location.href = bookId ? `detail.html?id=${bookId}` : 'index.html';
}

function toggleSidebar() {
    const sidebar = document.getElementById('watch-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
}

async function shareContent() {
    const name = currentDrama?.bookInfo?.bookName || currentDrama?.bookName || 'DramaBox';
    const url = window.location.href;

    if (navigator.share) {
        try {
            await navigator.share({ title: name, text: `ดู ${name} บน DramaBox`, url });
        } catch (e) {
            if (e.name !== 'AbortError') copyToClipboard(url);
        }
    } else {
        copyToClipboard(url);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showToast('คัดลอกลิงก์แล้ว!', 'success')).catch(() => { });
}

// Export functions
window.changeEpisode = changeEpisode;
window.playPrev = playPrev;
window.playNext = playNext;
window.toggleFullscreen = toggleFullscreen;
window.goBack = goBack;
window.shareContent = shareContent;
window.togglePlay = togglePlay;
window.skipTime = skipTime;
window.seekTo = seekTo;
window.changeVolume = changeVolume;
window.toggleMute = toggleMute;
window.togglePIP = togglePIP;
window.toggleSidebar = toggleSidebar;
window.resumeFromHistory = resumeFromHistory;
