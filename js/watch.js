// ========================================
// Watch Page Script
// ========================================

// State
let bookId = null;
let chapterId = null;
let episodeNum = 1;
let seriesData = null;
let chaptersData = [];
let currentChapterIndex = 0;
let hls = null;

// Player state
let isPlaying = false;
let isMuted = false;
let volume = 1;
let controlsTimeout = null;
let nextEpisodeTimeout = null;
const CONTROLS_HIDE_DELAY = 5000;

// Elements
const video = document.getElementById('video-player');
const videoContainer = document.getElementById('video-container');
const videoOverlay = document.getElementById('video-overlay');
const videoLoading = document.getElementById('video-loading');
const videoPlayBtn = document.getElementById('video-play-btn');
const videoControls = document.getElementById('video-controls');
const playerTopBar = document.getElementById('player-top-bar');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    bookId = Utils.getUrlParam('id');
    chapterId = Utils.getUrlParam('ep');
    episodeNum = parseInt(Utils.getUrlParam('num')) || 1;

    if (!bookId) {
        Utils.toast('ไม่พบข้อมูลซีรี่ย์', 'error');
        setTimeout(() => history.back(), 1500);
        return;
    }

    try {
        await loadSeriesData();
        await checkAdAndPlay();
    } catch (error) {
        console.error('Failed to initialize watch page:', error);
        Utils.toast('เกิดข้อผิดพลาด', 'error');
    }

    setupEventListeners();
    setupKeyboardControls();
});

// Load series and chapters data
async function loadSeriesData() {
    const [detailResult, chaptersResult] = await Promise.all([
        API.getDetail(bookId),
        API.getChapters(bookId)
    ]);

    if (detailResult?.success) {
        seriesData = detailResult.data;
        updateSeriesInfo();
    }

    if (chaptersResult?.success) {
        chaptersData = chaptersResult.data;
        renderEpisodesList();

        // Find current chapter index
        if (chapterId) {
            currentChapterIndex = chaptersData.findIndex(c => c.chapterId === chapterId);
            if (currentChapterIndex === -1) currentChapterIndex = 0;
        }

        updateNavigationButtons();
    }
}

// Check ad requirement and play
async function checkAdAndPlay() {
    const loadingScreen = document.getElementById('loading-screen');
    const isVIP = Auth.isVIP();
    const isUnlocked = Storage.adUnlock.isUnlocked(bookId);

    if (isVIP || isUnlocked) {
        await loadVideo();
    } else if (CONFIG.ADS.AD_POPUP_ENABLED) {
        // Hide loading screen before showing ad modal
        loadingScreen?.classList.add('hidden');
        showAdModal();
    } else {
        await loadVideo();
    }
}

// Show ad modal
function showAdModal() {
    const modal = document.getElementById('ad-modal');
    const skipBtn = document.getElementById('btn-skip-ad');
    const countdown = document.getElementById('ad-countdown');
    const skipWithPoints = document.getElementById('btn-skip-with-points');
    const adLink = document.getElementById('ad-link');

    modal.classList.add('active');

    // Set ad link (mock)
    adLink.href = 'https://example.com/ad';

    // Countdown
    let count = 5;
    const countdownInterval = setInterval(() => {
        count--;
        if (count <= 0) {
            clearInterval(countdownInterval);
            skipBtn.disabled = false;
            countdown.textContent = 'ข้ามโฆษณา';
        } else {
            countdown.textContent = `รอสักครู่ (${count})`;
        }
    }, 1000);

    // Skip button
    skipBtn.onclick = () => {
        if (!skipBtn.disabled) {
            Storage.adUnlock.set(bookId);
            modal.classList.remove('active');
            loadVideo();
        }
    };

    // Skip with points
    skipWithPoints.onclick = () => {
        const points = Storage.points.get();
        if (points >= CONFIG.ADS.SKIP_POINTS_COST) {
            Storage.points.subtract(CONFIG.ADS.SKIP_POINTS_COST);
            Storage.adUnlock.set(bookId);
            modal.classList.remove('active');
            loadVideo();
            Utils.toast(`ใช้ ${CONFIG.ADS.SKIP_POINTS_COST} Points ข้ามโฆษณา`, 'success');
        } else {
            Utils.toast(`Points ไม่เพียงพอ (ต้องการ ${CONFIG.ADS.SKIP_POINTS_COST})`, 'error');
        }
    };

    // Ad link click
    adLink.onclick = () => {
        setTimeout(() => {
            skipBtn.disabled = false;
            countdown.textContent = 'ข้ามโฆษณา';
        }, 1000);
    };
}

// Load video
async function loadVideo() {
    const loadingScreen = document.getElementById('loading-screen');
    videoLoading.classList.remove('hidden');

    try {
        // Use videoPath directly from chapters data (faster, no extra API call)
        const targetChapter = chapterId
            ? chaptersData.find(c => c.chapterId === chapterId)
            : chaptersData[0];

        if (!targetChapter) throw new Error('No chapter found');

        const streamUrl = targetChapter.videoPath;

        if (streamUrl) {
            initPlayer(streamUrl);
            chapterId = targetChapter.chapterId;
            updateEpisodeInfo();

            // Save to history
            Storage.history.add({
                bookId,
                name: seriesData?.bookName || seriesData?.name,
                cover: seriesData?.coverWap || seriesData?.cover,
                chapterCount: seriesData?.chapterCount,
                lastChapterId: chapterId
            });
        } else {
            throw new Error('No stream URL');
        }
    } catch (error) {
        console.error('Failed to load video:', error);
        Utils.toast('ไม่สามารถโหลดวิดีโอได้', 'error');
    } finally {
        loadingScreen?.classList.add('hidden');
        videoLoading.classList.add('hidden');
    }
}

// Initialize player
function initPlayer(url) {
    // Destroy existing HLS instance
    if (hls) {
        hls.destroy();
        hls = null;
    }

    // Check if HLS is needed
    if (url.includes('.m3u8')) {
        if (Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(url);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                playVideo();
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error('HLS fatal error:', data);
                    Utils.toast('เกิดข้อผิดพลาดในการเล่นวิดีโอ', 'error');
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            video.src = url;
            video.addEventListener('loadedmetadata', () => playVideo());
        }
    } else {
        // Direct MP4
        video.src = url;
        video.addEventListener('loadedmetadata', () => playVideo());
    }
}

// Play video
function playVideo() {
    video.play().then(() => {
        isPlaying = true;
        updatePlayButton();
        hideControlsDelayed();
    }).catch(err => {
        console.log('Autoplay blocked:', err);
        videoOverlay.classList.add('show-play');
    });
}

// Update series info
function updateSeriesInfo() {
    // Try to get name from: 1) URL param  2) localStorage history  3) seriesData  4) fallback
    let name = decodeURIComponent(Utils.getUrlParam('name') || '');

    if (!name) {
        // Try to get from watch history
        const history = Storage.history.get();
        const historyItem = history.find(h => h.bookId === bookId);
        if (historyItem) {
            name = historyItem.name;
        }
    }

    if (!name) {
        name = seriesData?.bookName || seriesData?.name || 'ไม่ทราบชื่อ';
    }

    document.title = `${name} - ตอนที่ ${episodeNum} - DramPop`;
    document.getElementById('video-title').textContent = name;
    document.getElementById('episode-title-bar').textContent = name;
}

// Update episode info
function updateEpisodeInfo() {
    document.getElementById('video-episode').textContent = `ตอนที่ ${episodeNum}`;
    document.getElementById('episode-meta-bar').textContent = `ตอนที่ ${episodeNum} จาก ${chaptersData.length} ตอน`;

    // Update episode list
    const items = document.querySelectorAll('.episode-item');
    items.forEach((item, index) => {
        item.classList.toggle('current', index === currentChapterIndex);
    });
}

// Render episodes list
function renderEpisodesList() {
    const list = document.getElementById('episodes-list');

    list.innerHTML = chaptersData.map((chapter, index) => `
        <div class="episode-item ${index === currentChapterIndex ? 'current' : ''}" 
             onclick="switchEpisode(${index})"
             data-index="${index}">
            <div class="ep-num">${index + 1}</div>
            <div class="ep-info">
                <div class="ep-title">ตอนที่ ${index + 1}</div>
            </div>
            ${index === currentChapterIndex ? '<i class="fas fa-play ep-playing"></i>' : ''}
        </div>
    `).join('');
}

// Switch episode
async function switchEpisode(index) {
    if (index < 0 || index >= chaptersData.length) return;

    currentChapterIndex = index;
    chapterId = chaptersData[index].chapterId;
    episodeNum = index + 1;

    // Update URL
    const url = new URL(window.location);
    url.searchParams.set('ep', chapterId);
    url.searchParams.set('num', episodeNum);
    history.replaceState({}, '', url);

    // Load new video
    videoLoading.classList.remove('hidden');
    await loadVideo();
    updateNavigationButtons();

    // Close sidebar on mobile
    document.getElementById('episodes-sidebar').classList.remove('open');
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');

    prevBtn.disabled = currentChapterIndex <= 0;
    nextBtn.disabled = currentChapterIndex >= chaptersData.length - 1;
}

// Setup event listeners
function setupEventListeners() {
    // Video events
    video.addEventListener('play', () => {
        isPlaying = true;
        updatePlayButton();
        videoOverlay.classList.remove('show-play');
    });

    video.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayButton();
        showControls();
        videoOverlay.classList.add('show-play');
    });

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', () => {
        document.getElementById('time-total').textContent = Utils.formatTime(video.duration);
    });

    video.addEventListener('waiting', () => videoLoading.classList.remove('hidden'));
    video.addEventListener('canplay', () => videoLoading.classList.add('hidden'));

    video.addEventListener('ended', onVideoEnded);

    // Progress bar
    const progressBar = document.getElementById('progress-bar');
    progressBar.addEventListener('click', seekVideo);

    // Control buttons
    document.getElementById('btn-play-pause').addEventListener('click', togglePlay);
    videoPlayBtn.addEventListener('click', togglePlay);
    document.getElementById('btn-mute').addEventListener('click', toggleMute);
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
    document.getElementById('btn-prev').addEventListener('click', () => switchEpisode(currentChapterIndex - 1));
    document.getElementById('btn-next').addEventListener('click', () => switchEpisode(currentChapterIndex + 1));

    // Volume slider
    const volumeSlider = document.getElementById('volume-slider');
    volumeSlider.addEventListener('input', (e) => {
        volume = parseFloat(e.target.value);
        video.volume = volume;
        updateVolumeIcon();
    });

    // Video container click/tap
    videoContainer.addEventListener('click', handleVideoClick);

    // Double tap handling
    setupDoubleTap();

    // Show controls on mouse move
    videoContainer.addEventListener('mousemove', () => {
        showControls();
        hideControlsDelayed();
    });

    // Episode sidebar toggle
    document.getElementById('btn-toggle-episodes').addEventListener('click', () => {
        document.getElementById('episodes-sidebar').classList.add('open');
    });

    document.getElementById('btn-close-sidebar').addEventListener('click', () => {
        document.getElementById('episodes-sidebar').classList.remove('open');
    });

    // Next episode toast
    document.getElementById('btn-cancel-next').addEventListener('click', cancelNextEpisode);
    document.getElementById('btn-play-next').addEventListener('click', playNextEpisode);

    // PIP
    document.getElementById('btn-pip')?.addEventListener('click', togglePIP);

    // Settings button - Playback speed
    document.getElementById('btn-settings')?.addEventListener('click', showSettingsMenu);
}

// Handle video click
function handleVideoClick(e) {
    if (e.target.closest('.video-controls') || e.target.closest('.player-top-bar')) return;

    if (videoControls.classList.contains('hidden')) {
        showControls();
        hideControlsDelayed();
    } else {
        togglePlay();
    }
}

// Setup double tap for skip
function setupDoubleTap() {
    let lastTap = 0;
    let tapTimeout = null;

    const handleDoubleTap = (area, seconds) => {
        const now = Date.now();
        const tap = lastTap;
        lastTap = now;

        if (now - tap < 300) {
            clearTimeout(tapTimeout);
            video.currentTime += seconds;
            area.classList.add('active');
            setTimeout(() => area.classList.remove('active'), 500);
        }
    };

    document.getElementById('tap-left').addEventListener('click', function () {
        handleDoubleTap(this, -5);
    });

    document.getElementById('tap-right').addEventListener('click', function () {
        handleDoubleTap(this, 5);
    });
}

// Keyboard controls
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                video.currentTime -= 5;
                showSkipIndicator('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                video.currentTime += 5;
                showSkipIndicator('right');
                break;
            case 'ArrowUp':
                e.preventDefault();
                video.volume = Math.min(1, video.volume + 0.1);
                document.getElementById('volume-slider').value = video.volume;
                updateVolumeIcon();
                break;
            case 'ArrowDown':
                e.preventDefault();
                video.volume = Math.max(0, video.volume - 0.1);
                document.getElementById('volume-slider').value = video.volume;
                updateVolumeIcon();
                break;
            case 'm':
                toggleMute();
                break;
            case 'f':
                toggleFullscreen();
                break;
        }
    });
}

// Show skip indicator
function showSkipIndicator(direction) {
    const area = document.getElementById(`tap-${direction}`);
    area.classList.add('active');
    setTimeout(() => area.classList.remove('active'), 500);
}

// Toggle play/pause
function togglePlay() {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

// Update play button
function updatePlayButton() {
    const icon = isPlaying ? 'fa-pause' : 'fa-play';
    document.getElementById('btn-play-pause').innerHTML = `<i class="fas ${icon}"></i>`;
    videoPlayBtn.innerHTML = `<i class="fas ${icon}"></i>`;
}

// Toggle mute
function toggleMute() {
    isMuted = !isMuted;
    video.muted = isMuted;
    updateVolumeIcon();
}

// Update volume icon
function updateVolumeIcon() {
    const btn = document.getElementById('btn-mute');
    let icon = 'fa-volume-up';
    if (isMuted || video.volume === 0) icon = 'fa-volume-mute';
    else if (video.volume < 0.5) icon = 'fa-volume-down';
    btn.innerHTML = `<i class="fas ${icon}"></i>`;
}

// Toggle fullscreen
function toggleFullscreen() {
    // Check if already in fullscreen
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    } else {
        // Enter fullscreen on video container
        if (videoContainer.requestFullscreen) {
            videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
            videoContainer.webkitRequestFullscreen();
        } else if (video.webkitEnterFullscreen) {
            // iOS Safari - use native video fullscreen
            video.webkitEnterFullscreen();
        }
    }
}

// Update fullscreen button icon on fullscreen change
document.addEventListener('fullscreenchange', updateFullscreenIcon);
document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);

function updateFullscreenIcon() {
    const btn = document.getElementById('btn-fullscreen');
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    btn.innerHTML = `<i class="fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}"></i>`;
}

// Toggle PIP
async function togglePIP() {
    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else if (video.requestPictureInPicture) {
            await video.requestPictureInPicture();
        }
    } catch (err) {
        Utils.toast('PIP ไม่รองรับบนอุปกรณ์นี้', 'info');
    }
}

// Update progress
function updateProgress() {
    const progress = (video.currentTime / video.duration) * 100;
    document.getElementById('progress-played').style.width = `${progress}%`;
    document.getElementById('progress-thumb').style.left = `${progress}%`;
    document.getElementById('time-current').textContent = Utils.formatTime(video.currentTime);

    // Update history progress
    Storage.history.updateProgress(bookId, chapterId, video.currentTime, video.duration);
}

// Seek video
function seekVideo(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
}

// Show controls
function showControls() {
    videoControls.classList.remove('hidden');
    playerTopBar.classList.remove('hidden');
}

// Hide controls
function hideControls() {
    if (isPlaying) {
        videoControls.classList.add('hidden');
        playerTopBar.classList.add('hidden');
    }
}

// Hide controls with delay
function hideControlsDelayed() {
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(hideControls, CONTROLS_HIDE_DELAY);
}

// On video ended - Auto play next episode
function onVideoEnded() {
    if (currentChapterIndex < chaptersData.length - 1) {
        // Auto play next episode immediately
        playNextEpisode();
    }
}

// Show next episode toast
function showNextEpisodeToast() {
    const toast = document.getElementById('next-episode-toast');
    const countdown = document.getElementById('next-countdown');

    toast.classList.add('visible');

    let count = 5;
    countdown.textContent = count;

    nextEpisodeTimeout = setInterval(() => {
        count--;
        countdown.textContent = count;

        if (count <= 0) {
            playNextEpisode();
        }
    }, 1000);
}

// Cancel next episode
function cancelNextEpisode() {
    clearInterval(nextEpisodeTimeout);
    document.getElementById('next-episode-toast').classList.remove('visible');
}

// Play next episode
function playNextEpisode() {
    clearInterval(nextEpisodeTimeout);
    document.getElementById('next-episode-toast').classList.remove('visible');
    switchEpisode(currentChapterIndex + 1);
}

// Go back
function goBack() {
    if (history.length > 1) {
        history.back();
    } else {
        Utils.navigate('detail.html', { id: bookId });
    }
}

// Show settings menu
async function showSettingsMenu() {
    const currentSpeed = video.playbackRate;

    const { value: speed } = await Swal.fire({
        title: 'ตั้งค่า',
        html: `
            <div style="text-align: left; padding: 10px 0;">
                <p style="margin-bottom: 10px; font-weight: 600;">ความเร็วในการเล่น:</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                    ${[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => `
                        <button class="speed-btn ${currentSpeed === s ? 'active' : ''}" data-speed="${s}" style="
                            padding: 10px 20px;
                            border: 2px solid ${currentSpeed === s ? '#6366f1' : '#333'};
                            background: ${currentSpeed === s ? 'rgba(99,102,241,0.2)' : '#1a1a1a'};
                            color: white;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                        ">${s === 1 ? 'ปกติ' : s + 'x'}</button>
                    `).join('')}
                </div>
            </div>
        `,
        background: '#1a1a1a',
        color: '#fff',
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
            document.querySelectorAll('.speed-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const newSpeed = parseFloat(btn.dataset.speed);
                    video.playbackRate = newSpeed;
                    Swal.close();
                    Utils.toast(`ความเร็ว: ${newSpeed === 1 ? 'ปกติ' : newSpeed + 'x'}`, 'success');
                });
            });
        }
    });
}

// Make functions global
window.switchEpisode = switchEpisode;
window.goBack = goBack;
