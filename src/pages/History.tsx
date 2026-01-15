import { useState } from "react";
import { Link } from "react-router-dom";
import { History as HistoryIcon, Trash2, Play, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    getWatchHistory,
    removeFromHistory,
    clearWatchHistory,
    WatchHistoryItem,
} from "@/lib/history";

const History = () => {
    const [history, setHistory] = useState<WatchHistoryItem[]>(() =>
        getWatchHistory()
    );

    const handleRemove = (bookId: string) => {
        removeFromHistory(bookId);
        setHistory(getWatchHistory());
    };

    const handleClearAll = () => {
        clearWatchHistory();
        setHistory([]);
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return "เมื่อสักครู่";
        if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
        if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
        return date.toLocaleDateString("th-TH");
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-20 pb-12">
                <div className="container max-w-4xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <HistoryIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="font-display font-bold text-2xl md:text-3xl gradient-text">
                                    ประวัติการดู
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    ซีรีส์ที่คุณดูล่าสุด
                                </p>
                            </div>
                        </div>

                        {history.length > 0 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-destructive">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        ลบทั้งหมด
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>ลบประวัติการดูทั้งหมด?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            การดำเนินการนี้ไม่สามารถย้อนกลับได้ ประวัติการดูทั้งหมดจะถูกลบออก
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleClearAll}>
                                            ลบทั้งหมด
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>

                    {/* History List */}
                    {history.length === 0 ? (
                        <div className="text-center py-16">
                            <HistoryIcon className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">ยังไม่มีประวัติการดู</h2>
                            <p className="text-muted-foreground mb-6">
                                เริ่มดูซีรีส์เพื่อบันทึกประวัติการดูของคุณ
                            </p>
                            <Link to="/">
                                <Button>สำรวจซีรีส์</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item) => (
                                <div
                                    key={item.bookId}
                                    className="bg-card rounded-2xl p-4 flex gap-4 group hover:bg-card/80 transition-colors"
                                >
                                    {/* Cover Image */}
                                    <Link
                                        to={`/watch/${item.bookId}/${item.currentEpisode}`}
                                        className="relative flex-shrink-0"
                                    >
                                        <img
                                            src={item.coverWap || "/placeholder.svg"}
                                            alt={item.bookName}
                                            className="w-24 h-32 sm:w-28 sm:h-36 object-cover rounded-xl"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                            <Play className="w-8 h-8 text-white" fill="white" />
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <Link to={`/detail/${item.bookId}`}>
                                            <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
                                                {item.bookName}
                                            </h3>
                                        </Link>

                                        <p className="text-muted-foreground text-sm mt-1">
                                            ตอนที่ {item.currentEpisode} / {item.totalEpisodes}
                                        </p>

                                        {/* Progress Bar */}
                                        <div className="mt-2 flex items-center gap-3">
                                            <Progress value={item.progress} className="flex-1 h-2" />
                                            <span className="text-xs text-muted-foreground">
                                                {item.progress}%
                                            </span>
                                        </div>

                                        {/* Time & Actions */}
                                        <div className="mt-auto pt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(item.lastWatchedAt)}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemove(item.bookId)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <Link to={`/watch/${item.bookId}/${item.currentEpisode}`}>
                                                    <Button size="sm" className="gap-1">
                                                        <Play className="w-4 h-4" />
                                                        ดูต่อ
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default History;
