import { useState, useRef, useEffect, useCallback } from "react";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Settings,
    SkipForward,
    Download,
    Loader2,
    ChevronRight,
    RotateCw,
    PictureInPicture2,
    Camera,
    Rewind,
    FastForward,
    Cast,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    onEnded?: () => void;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    skipIntroTime?: number; // seconds to skip for intro
    skipOutroTime?: number; // seconds before end for outro
    onNextEpisode?: () => void;
    onPrevEpisode?: () => void;
    hasNextEpisode?: boolean;
    hasPrevEpisode?: boolean;
}

const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITY_OPTIONS = [
    { label: 'อัตโนมัติ', value: 'auto' },
    { label: '1080p', value: '1080' },
    { label: '720p', value: '720' },
    { label: '480p', value: '480' },
    { label: '360p', value: '360' },
];

export function VideoPlayer({
    src,
    poster,
    onEnded,
    onTimeUpdate,
    skipIntroTime = 15,
    skipOutroTime = 30,
    onNextEpisode,
    hasNextEpisode = false,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSkipOutro, setShowSkipOutro] = useState(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPosition, setHoverPosition] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [quality, setQuality] = useState('auto');
    const [showSeekIndicator, setShowSeekIndicator] = useState<'left' | 'right' | null>(null);
    const [isPiP, setIsPiP] = useState(false);
    const [isCasting, setIsCasting] = useState(false);
    const [canCast, setCanCast] = useState(false);
    const lastTapRef = useRef<{ time: number; side: 'left' | 'right' } | null>(null);

    // Detect if on mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto fullscreen when rotating video
    const handleRotate = async () => {
        const newRotation = (rotation + 90) % 360;
        setRotation(newRotation);

        // Auto-enter fullscreen when rotating (for all devices)
        if (!document.fullscreenElement && containerRef.current) {
            try {
                await containerRef.current.requestFullscreen();
            } catch (error) {
                // Fallback for webkit browsers
                const container = containerRef.current as any;
                if (container.webkitRequestFullscreen) {
                    try {
                        container.webkitRequestFullscreen();
                    } catch (e) {
                        console.log('Webkit fullscreen request failed:', e);
                    }
                } else if (container.msRequestFullscreen) {
                    // Fallback for IE/Edge
                    try {
                        container.msRequestFullscreen();
                    } catch (e) {
                        console.log('MS fullscreen request failed:', e);
                    }
                }
            }
        }
    };

    // Auto fullscreen on mobile when video starts playing
    const handleVideoPlay = async () => {
        setIsPlaying(true);

        // On mobile, auto-enter fullscreen when video starts playing
        if (isMobile && !document.fullscreenElement && containerRef.current) {
            try {
                await containerRef.current.requestFullscreen();
            } catch (error) {
                // Fallback: try webkit fullscreen for iOS Safari
                const video = videoRef.current;
                if (video && (video as any).webkitEnterFullscreen) {
                    try {
                        (video as any).webkitEnterFullscreen();
                    } catch (e) {
                        console.log('Webkit fullscreen request failed:', e);
                    }
                }
            }
        }
    };

    // Show/hide controls with timeout
    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        if (hideControlsTimeout.current) {
            clearTimeout(hideControlsTimeout.current);
        }
        if (isPlaying) {
            hideControlsTimeout.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    }, [isPlaying]);

    // Video event handlers
    const handlePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video) return;

        setCurrentTime(video.currentTime);
        onTimeUpdate?.(video.currentTime, video.duration);

        // Show skip outro button (within last skipOutroTime seconds)
        const timeRemaining = video.duration - video.currentTime;
        setShowSkipOutro(timeRemaining < skipOutroTime && timeRemaining > 5);
    };

    const handleLoadedMetadata = () => {
        const video = videoRef.current;
        if (video) {
            setDuration(video.duration);
        }
    };

    const handleVolumeChange = (value: number[]) => {
        const vol = value[0];
        setVolume(vol);
        if (videoRef.current) {
            videoRef.current.volume = vol;
            setIsMuted(vol === 0);
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isMuted) {
            video.muted = false;
            video.volume = volume || 0.5;
            setIsMuted(false);
        } else {
            video.muted = true;
            setIsMuted(true);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        const progress = progressRef.current;
        if (!video || !progress) return;

        const rect = progress.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        video.currentTime = percent * video.duration;
    };

    const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
        const progress = progressRef.current;
        if (!progress || !duration) return;

        const rect = progress.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        setHoverTime(percent * duration);
        setHoverPosition(e.clientX - rect.left);
    };

    const toggleFullscreen = async () => {
        const container = containerRef.current;
        if (!container) return;

        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await container.requestFullscreen();
        }
    };

    const handleSkipIntro = () => {
        const video = videoRef.current;
        if (video) {
            video.currentTime = skipIntroTime;
        }
    };

    const handleSkipOutro = () => {
        if (onNextEpisode && hasNextEpisode) {
            onNextEpisode();
        } else {
            onEnded?.();
        }
    };

    const handlePlaybackSpeedChange = (speed: number) => {
        setPlaybackSpeed(speed);
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
    };

    const handleDownload = async () => {
        if (!src) return;

        try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `video-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            // Fallback: open in new tab
            window.open(src, "_blank");
        }
    };

    // Picture-in-Picture handler
    const togglePiP = async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPiP(false);
            } else if (document.pictureInPictureEnabled) {
                await video.requestPictureInPicture();
                setIsPiP(true);
            }
        } catch (error) {
            console.log('PiP request failed:', error);
        }
    };

    // Screenshot handler
    const handleScreenshot = () => {
        const video = videoRef.current;
        if (!video) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const link = document.createElement('a');
            link.download = `screenshot-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    // Double-tap to seek handler
    const handleDoubleTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container || !videoRef.current) return;

        const rect = container.getBoundingClientRect();
        let clientX: number;

        if ('touches' in e) {
            clientX = e.touches[0]?.clientX || e.changedTouches[0]?.clientX || 0;
        } else {
            clientX = e.clientX;
        }

        const side = clientX < rect.left + rect.width / 2 ? 'left' : 'right';
        const now = Date.now();

        if (lastTapRef.current && now - lastTapRef.current.time < 300 && lastTapRef.current.side === side) {
            // Double tap detected
            const video = videoRef.current;
            if (side === 'left') {
                video.currentTime = Math.max(0, video.currentTime - 10);
            } else {
                video.currentTime = Math.min(video.duration, video.currentTime + 10);
            }
            setShowSeekIndicator(side);
            setTimeout(() => setShowSeekIndicator(null), 500);
            lastTapRef.current = null;
        } else {
            lastTapRef.current = { time: now, side };
        }
    };

    // PiP event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePiPEnter = () => setIsPiP(true);
        const handlePiPLeave = () => setIsPiP(false);

        video.addEventListener('enterpictureinpicture', handlePiPEnter);
        video.addEventListener('leavepictureinpicture', handlePiPLeave);

        return () => {
            video.removeEventListener('enterpictureinpicture', handlePiPEnter);
            video.removeEventListener('leavepictureinpicture', handlePiPLeave);
        };
    }, []);

    // Cast handler using Remote Playback API
    const handleCast = async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            // Check if Remote Playback API is available
            if ('remote' in video) {
                const remote = (video as any).remote;

                if (isCasting) {
                    // Stop casting
                    await remote.cancelWatchAvailability();
                    setIsCasting(false);
                } else {
                    // Start casting - prompt user to select device
                    await remote.prompt();
                }
            } else {
                // Fallback: Use experimental Web Share API or alert
                alert('กรุณาใช้ Chrome บน Android หรือ Safari บน iOS เพื่อใช้งาน Cast');
            }
        } catch (error: any) {
            if (error.name === 'NotSupportedError') {
                alert('อุปกรณ์ไม่รองรับการ Cast');
            } else if (error.name !== 'NotAllowedError') {
                console.log('Cast failed:', error);
            }
        }
    };

    // Check if casting is available
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Check for Remote Playback API support
        if ('remote' in video) {
            const remote = (video as any).remote;

            remote.watchAvailability((available: boolean) => {
                setCanCast(available);
            }).catch(() => {
                // Remote playback not supported
                setCanCast(false);
            });

            // Listen for connection state changes
            remote.onconnecting = () => setIsCasting(false);
            remote.onconnect = () => setIsCasting(true);
            remote.ondisconnect = () => setIsCasting(false);
        }
    }, [src]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;

            const video = videoRef.current;
            if (!video) return;

            switch (e.code) {
                case "Space":
                    e.preventDefault();
                    handlePlayPause();
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    video.volume = Math.min(1, video.volume + 0.1);
                    setVolume(video.volume);
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    video.volume = Math.max(0, video.volume - 0.1);
                    setVolume(video.volume);
                    break;
                case "KeyM":
                    toggleMute();
                    break;
                case "KeyF":
                    toggleFullscreen();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [volume]);

    // Fullscreen change handler
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const progress = duration ? (currentTime / duration) * 100 : 0;
    const buffered = videoRef.current?.buffered.length
        ? (videoRef.current.buffered.end(videoRef.current.buffered.length - 1) / duration) * 100
        : 0;

    return (
        <div
            ref={containerRef}
            className={`relative group bg-black ${isFullscreen ? "fixed inset-0 z-50" : "rounded-2xl overflow-hidden w-full max-w-full mx-auto"}`}
            style={{
                aspectRatio: isFullscreen ? undefined : '9 / 16',
                maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 200px)'
            }}
            onMouseMove={resetControlsTimeout}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className="cursor-pointer transition-transform duration-300"
                style={{
                    transform: `rotate(${rotation}deg)${(rotation === 90 || rotation === 270) ? ' scale(1.78)' : ''}`,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                }}
                onClick={handlePlayPause}
                onPlay={handleVideoPlay}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={onEnded}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                playsInline
            />

            {/* Buffering Indicator */}
            {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
            )}

            {/* Big Play Button (when paused) */}
            {!isPlaying && !isBuffering && (
                <button
                    onClick={handlePlayPause}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <Play className="w-10 h-10 text-white ml-1" fill="white" />
                    </div>
                </button>
            )}


            {/* Skip Outro / Next Episode Button */}
            {showSkipOutro && hasNextEpisode && (
                <button
                    onClick={handleSkipOutro}
                    className="absolute bottom-24 right-4 px-4 py-2 bg-white/90 text-black font-medium rounded-lg hover:bg-white transition-colors flex items-center gap-2 shadow-lg"
                >
                    <SkipForward className="w-4 h-4" />
                    ตอนถัดไป
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}

            {/* Double-tap seek indicators */}
            {showSeekIndicator === 'left' && (
                <div className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full animate-pulse">
                    <Rewind className="w-6 h-6 text-white" />
                    <span className="text-white font-medium">-10 วินาที</span>
                </div>
            )}
            {showSeekIndicator === 'right' && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full animate-pulse">
                    <FastForward className="w-6 h-6 text-white" />
                    <span className="text-white font-medium">+10 วินาที</span>
                </div>
            )}

            {/* Double-tap overlay zones - pointer-events only on mobile */}
            {isMobile && (
                <>
                    <div
                        className="absolute inset-y-0 left-0 w-1/3"
                        onClick={handleDoubleTap}
                        onTouchEnd={handleDoubleTap}
                    />
                    <div
                        className="absolute inset-y-0 right-0 w-1/3"
                        onClick={handleDoubleTap}
                        onTouchEnd={handleDoubleTap}
                    />
                </>
            )}

            {/* Controls Overlay */}
            <div
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
            >
                {/* Progress Bar */}
                <div
                    ref={progressRef}
                    className="relative h-1 bg-white/30 rounded-full mb-4 cursor-pointer group/progress hover:h-2 transition-all"
                    onClick={handleSeek}
                    onMouseMove={handleProgressHover}
                    onMouseLeave={() => setHoverTime(null)}
                >
                    {/* Buffered */}
                    <div
                        className="absolute h-full bg-white/40 rounded-full"
                        style={{ width: `${buffered}%` }}
                    />
                    {/* Progress */}
                    <div
                        className="absolute h-full bg-primary rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                    {/* Hover Time Tooltip */}
                    {hoverTime !== null && (
                        <div
                            className="absolute -top-8 px-2 py-1 bg-black/90 text-white text-xs rounded"
                            style={{ left: hoverPosition, transform: "translateX(-50%)" }}
                        >
                            {formatTime(hoverTime)}
                        </div>
                    )}
                    {/* Scrubber */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                        style={{ left: `${progress}%`, transform: "translateX(-50%) translateY(-50%)" }}
                    />
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between gap-4">
                    {/* Left Controls */}
                    <div className="flex items-center gap-3">
                        {/* Play/Pause */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={handlePlayPause}
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5" fill="white" />
                            ) : (
                                <Play className="w-5 h-5" fill="white" />
                            )}
                        </Button>

                        {/* Next Episode */}
                        {hasNextEpisode && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20"
                                onClick={onNextEpisode}
                            >
                                <SkipForward className="w-5 h-5" />
                            </Button>
                        )}

                        {/* Volume */}
                        <div className="flex items-center gap-2 group/volume">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20"
                                onClick={toggleMute}
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX className="w-5 h-5" />
                                ) : (
                                    <Volume2 className="w-5 h-5" />
                                )}
                            </Button>
                            <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-200">
                                <Slider
                                    value={[isMuted ? 0 : volume]}
                                    max={1}
                                    step={0.01}
                                    onValueChange={handleVolumeChange}
                                    className="w-20"
                                />
                            </div>
                        </div>

                        {/* Time */}
                        <span className="text-white text-sm font-medium">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2">
                        {/* Rotate */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={handleRotate}
                            title="หมุนหน้าจอ"
                        >
                            <RotateCw className="w-5 h-5" />
                        </Button>

                        {/* Screenshot */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={handleScreenshot}
                            title="ถ่ายภาพหน้าจอ"
                        >
                            <Camera className="w-5 h-5" />
                        </Button>

                        {/* Picture-in-Picture */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`text-white hover:bg-white/20 ${isPiP ? 'bg-primary/30' : ''}`}
                            onClick={togglePiP}
                            title="Picture-in-Picture"
                        >
                            <PictureInPicture2 className="w-5 h-5" />
                        </Button>

                        {/* Cast / Chromecast / Airplay */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`text-white hover:bg-white/20 ${isCasting ? 'bg-primary/30 text-primary' : ''}`}
                            onClick={handleCast}
                            title="Cast ไปยังทีวี"
                        >
                            <Cast className="w-5 h-5" />
                        </Button>

                        {/* Download */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={handleDownload}
                            title="ดาวน์โหลด"
                        >
                            <Download className="w-5 h-5" />
                        </Button>

                        {/* Settings */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                >
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        ความเร็ว: {playbackSpeed}x
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {PLAYBACK_SPEEDS.map((speed) => (
                                            <DropdownMenuItem
                                                key={speed}
                                                onClick={() => handlePlaybackSpeedChange(speed)}
                                                className={playbackSpeed === speed ? "bg-primary/20" : ""}
                                            >
                                                {speed}x
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        ความคมชัด: {quality === 'auto' ? 'อัตโนมัติ' : `${quality}p`}
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {QUALITY_OPTIONS.map((q) => (
                                            <DropdownMenuItem
                                                key={q.value}
                                                onClick={() => setQuality(q.value)}
                                                className={quality === q.value ? "bg-primary/20" : ""}
                                            >
                                                {q.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Fullscreen */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen ? (
                                <Minimize className="w-5 h-5" />
                            ) : (
                                <Maximize className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Touch overlay for mobile */}
            <div
                className="absolute inset-0 md:hidden"
                onClick={() => setShowControls(!showControls)}
            />
        </div>
    );
}
