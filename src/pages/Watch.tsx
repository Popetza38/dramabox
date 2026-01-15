import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  SkipForward,
  Hand,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { VideoPlayer } from "@/components/VideoPlayer";
import { fetchDramaDetail, fetchAllEpisodes, getVideoUrl } from "@/lib/api";
import { addToWatchHistory, getAutoPlayEnabled, setAutoPlayEnabled } from "@/lib/history";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

const Watch = () => {
  const { bookId, episodeNum } = useParams<{ bookId: string; episodeNum: string }>();
  const navigate = useNavigate();
  const currentEpisode = parseInt(episodeNum || "1", 10);
  const [episodePage, setEpisodePage] = useState(1);
  const [videoError, setVideoError] = useState(false);
  const [autoPlay, setAutoPlay] = useState(() => getAutoPlayEnabled());
  const lastSaveRef = useRef<number>(0);
  const episodesPerPage = 30;

  const { data: drama } = useQuery({
    queryKey: ["drama", bookId],
    queryFn: () => fetchDramaDetail(bookId!),
    enabled: !!bookId,
  });

  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ["episodes", bookId],
    queryFn: () => fetchAllEpisodes(bookId!),
    enabled: !!bookId,
  });

  const totalEpisodes = drama?.chapterCount || episodes?.length || 0;
  const totalPages = Math.ceil(totalEpisodes / episodesPerPage);

  // Get current episode data and extract video URL
  const currentEpisodeData = episodes?.[currentEpisode - 1];
  const videoUrl = getVideoUrl(currentEpisodeData, 720);

  // Reset video error when episode changes
  useEffect(() => {
    setVideoError(false);
  }, [currentEpisode, videoUrl]);

  // Update episode page when episode changes
  useEffect(() => {
    const pageForEpisode = Math.ceil(currentEpisode / episodesPerPage);
    setEpisodePage(pageForEpisode);
  }, [currentEpisode]);

  // Save to watch history when drama data is available
  useEffect(() => {
    if (drama && bookId && episodes?.length) {
      addToWatchHistory({
        bookId,
        bookName: drama.bookName || "Unknown",
        coverWap: drama.coverWap || "",
        currentEpisode,
        totalEpisodes: drama.chapterCount || episodes.length,
        progress: 0,
      });
    }
  }, [drama, bookId, currentEpisode, episodes]);

  // Toggle auto-play
  const toggleAutoPlay = () => {
    const newValue = !autoPlay;
    setAutoPlay(newValue);
    setAutoPlayEnabled(newValue);
  };

  const goToEpisode = (ep: number) => {
    if (ep >= 1 && ep <= totalEpisodes) {
      navigate(`/watch/${bookId}/${ep}`);
    }
  };

  // Handle video time update - save progress periodically
  const handleVideoTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (!bookId || !drama) return;

    const now = Date.now();
    // Save progress every 10 seconds
    if (now - lastSaveRef.current < 10000) return;
    lastSaveRef.current = now;

    const progress = duration ? (currentTime / duration) * 100 : 0;
    addToWatchHistory({
      bookId,
      bookName: drama.bookName || "Unknown",
      coverWap: drama.coverWap || "",
      currentEpisode,
      totalEpisodes: drama.chapterCount || episodes?.length || 0,
      progress: Math.round(progress),
    });
  }, [bookId, drama, currentEpisode, episodes]);

  // Handle video ended - auto-play next episode
  const handleVideoEnded = useCallback(() => {
    // Always go to next episode when video ends (if available)
    if (currentEpisode < totalEpisodes) {
      navigate(`/watch/${bookId}/${currentEpisode + 1}`);
    }
  }, [currentEpisode, totalEpisodes, bookId, navigate]);

  // Swipe gestures for mobile
  const { touchHandlers, isSwiping } = useSwipeGesture({
    onSwipeLeft: () => goToEpisode(currentEpisode + 1),
    onSwipeRight: () => goToEpisode(currentEpisode - 1),
  });

  const getEpisodesForCurrentPage = () => {
    const start = (episodePage - 1) * episodesPerPage;
    return Array.from({ length: Math.min(episodesPerPage, totalEpisodes - start) }, (_, i) => start + i + 1);
  };

  if (!bookId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>ซีรีส์ไม่ถูกต้อง</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-12">
        <div className="container max-w-5xl">
          {/* Back Button */}
          <Link
            to={`/detail/${bookId}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            กลับไปหน้ารายละเอียด
          </Link>

          {/* Video Player */}
          <div
            className={`aspect-video mb-6 ${isSwiping ? "opacity-80" : ""}`}
            {...touchHandlers}
          >
            {episodesLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-card rounded-2xl">
                <Skeleton className="w-full h-full rounded-2xl" />
              </div>
            ) : videoUrl && !videoError ? (
              <VideoPlayer
                src={videoUrl}
                poster={drama?.coverWap}
                onEnded={handleVideoEnded}
                onTimeUpdate={handleVideoTimeUpdate}
                skipIntroTime={90}
                skipOutroTime={30}
                onNextEpisode={() => goToEpisode(currentEpisode + 1)}
                hasNextEpisode={currentEpisode < totalEpisodes}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-card rounded-2xl">
                <div className="text-center text-muted-foreground p-6">
                  {videoError ? (
                    <>
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
                      <p className="font-medium mb-2">ไม่สามารถเล่นวิดีโอได้</p>
                      <p className="text-sm">ลองตอนอื่นหรือรีเฟรชหน้า</p>
                    </>
                  ) : !episodes?.length ? (
                    <>
                      <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      <p>กำลังโหลดตอน...</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                      <p>ตอนนี้ไม่พร้อมใช้งาน</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Swipe indicator */}
            {isSwiping && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Hand className="w-12 h-12 text-white/50 animate-pulse" />
              </div>
            )}
          </div>

          {/* Episode Info & Navigation */}
          <div className="bg-card rounded-2xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-bold text-xl md:text-2xl gradient-text">
                  {drama?.bookName || "กำลังโหลด..."}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {currentEpisodeData?.chapterName || `ตอนที่ ${currentEpisode}`}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Auto-play Toggle */}
                <div className="flex items-center gap-2">
                  <SkipForward className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground hidden sm:inline">เล่นต่ออัตโนมัติ</span>
                  <Switch
                    checked={autoPlay}
                    onCheckedChange={toggleAutoPlay}
                    aria-label="เล่นตอนถัดไปอัตโนมัติ"
                  />
                </div>

                {/* Episode Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToEpisode(currentEpisode - 1)}
                    disabled={currentEpisode <= 1}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <span className="px-4 text-sm font-medium">
                    {currentEpisode} / {totalEpisodes}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToEpisode(currentEpisode + 1)}
                    disabled={currentEpisode >= totalEpisodes}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Synopsis / เรื่องย่อ */}
          {drama?.introduction && (
            <div className="bg-card rounded-2xl p-6 mb-6">
              <h2 className="font-semibold text-lg mb-3">เรื่องย่อ</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {drama.introduction}
              </p>
            </div>
          )}

          {/* Episode List */}
          <div className="bg-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">รายการตอน</h2>
              <span className="text-muted-foreground text-sm">{totalEpisodes} ตอน</span>
            </div>

            {/* Page Navigation */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEpisodePage((p) => Math.max(1, p - 1))}
                  disabled={episodePage <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Show pages around current page
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (episodePage <= 3) {
                      pageNum = i + 1;
                    } else if (episodePage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = episodePage - 2 + i;
                    }
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === episodePage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEpisodePage(pageNum)}
                      className={pageNum === episodePage ? "bg-primary" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEpisodePage((p) => Math.min(totalPages, p + 1))}
                  disabled={episodePage >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Episode Range Info */}
            <p className="text-center text-sm text-muted-foreground mb-4">
              ตอนที่ {(episodePage - 1) * episodesPerPage + 1} -{" "}
              {Math.min(episodePage * episodesPerPage, totalEpisodes)}
            </p>

            {/* Episode Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
              {getEpisodesForCurrentPage().map((ep) => (
                <button
                  key={ep}
                  onClick={() => goToEpisode(ep)}
                  className={`episode-grid-item py-3 text-sm font-medium ${ep === currentEpisode ? "active" : ""
                    }`}
                >
                  {ep}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Watch;
