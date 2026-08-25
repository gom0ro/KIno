"use client";

import Hls from "hls.js";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  getPosition,
  removePosition,
  savePosition,
} from "@/lib/watch-history";

interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
}

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

function levelLabel(l: QualityLevel): string {
  return l.height > 0
    ? `${l.height}p`
    : `${(l.bitrate / 1_000_000).toFixed(1)} Мбит/с`;
}

interface Props {
  src: string;
  title: string;
  movieId?: string;
}

export default function HlsPlayer({ src, title, movieId }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSaveRef = useRef(0);
  const lastPosRef = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [started, setStarted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controls, setControls] = useState(true);
  const [error, setError] = useState(false);

  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
  const [activeHeight, setActiveHeight] = useState<number | null>(null);
  const [qualityOpen, setQualityOpen] = useState(false);

  const sortedLevels = useMemo(
    () =>
      [...levels].sort(
        (a, b) => b.height - a.height || b.bitrate - a.bitrate
      ),
    [levels]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    setError(false);
    setLevels([]);
    setSelectedLevel(-1);
    setActiveHeight(null);
    setQualityOpen(false);

    const isHlsSource = src.includes(".m3u8");

    if (!isHlsSource) {
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        const list: QualityLevel[] = data.levels
          .map((l, i) => ({
            index: i,
            height: l.height ?? 0,
            bitrate: l.bitrate ?? 0,
          }))
          .filter((l) => l.height > 0 || l.bitrate > 0);
        setLevels(list);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        const level = hls?.levels[data.level];
        setActiveHeight(level?.height ?? null);
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setError(true);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      setError(true);
    }

    return () => {
      hls?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (!qualityOpen) return;
    const onDown = (e: globalThis.MouseEvent) => {
      if (!qualityRef.current?.contains(e.target as Node)) {
        setQualityOpen(false);
      }
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setQualityOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [qualityOpen]);

  const reveal = useCallback(() => {
    setControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setStarted(true);
    } else {
      v.pause();
    }
    reveal();
  }, [reveal]);

  const seekBy = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v || !Number.isFinite(v.duration)) return;
      v.currentTime = Math.min(
        Math.max(0, v.currentTime + delta),
        v.duration - 0.1
      );
      reveal();
    },
    [reveal]
  );

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    reveal();
  }, [reveal]);

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  }, []);

  const persist = useCallback(
    (v: HTMLVideoElement, force = false) => {
      if (!movieId || !Number.isFinite(v.duration) || v.duration <= 0) return;
      const now = Date.now();
      if (!force && now - lastSaveRef.current < 5000) return;
      lastSaveRef.current = now;
      savePosition(movieId, v.currentTime, v.duration);

      const prev = lastPosRef.current;
      lastPosRef.current = v.currentTime;
      if (prev === null) return;
      const delta = v.currentTime - prev;
      if (delta > 0.2 && delta <= 30 && navigator.onLine !== false) {
        void fetch("/api/watch-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieId, seconds: delta }),
          keepalive: true,
        }).catch(() => {});
      }
    },
    [movieId]
  );

  const selectQuality = useCallback(
    (index: number) => {
      const hlsInstance = hlsRef.current;
      if (!hlsInstance) return;
      hlsInstance.currentLevel = index;
      setSelectedLevel(index);
      setQualityOpen(false);
      reveal();
    },
    [reveal]
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        e.preventDefault();
        seekBy(10);
        break;
      case "ArrowLeft":
        e.preventDefault();
        seekBy(-10);
        break;
      case "m":
        toggleMute();
        break;
      case "f":
        toggleFullscreen();
        break;
    }
  };

  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const volPct = (muted ? 0 : volume) * 100;
  const rangeFill = `linear-gradient(to right, #c41230 ${pct}%, rgba(255,255,255,0.25) ${pct}%)`;
  const volFill = `linear-gradient(to right, #c41230 ${volPct}%, rgba(255,255,255,0.25) ${volPct}%)`;

  const qualityBadge =
    selectedLevel === -1
      ? activeHeight
        ? `Авто · ${activeHeight}p`
        : "Авто"
      : levelLabel(levels[selectedLevel] ?? { index: -1, height: 0, bitrate: 0 });

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      role="region"
      aria-label={`Плеер: ${title}`}
      onKeyDown={onKeyDown}
      onMouseMove={reveal}
      onTouchStart={reveal}
      className={`group relative aspect-video w-full select-none overflow-hidden rounded-xl bg-black outline-none ring-accent focus-visible:ring-2 ${
        fullscreen ? "rounded-none" : ""
      } ${!controls && started ? "cursor-none" : ""}`}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        className="h-full w-full"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={() => setPlaying(true)}
        onPause={(e) => {
          setPlaying(false);
          persist(e.currentTarget, true);
        }}
        onEnded={(e) => {
          setPlaying(false);
          if (movieId) removePosition(movieId);
        }}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          const saved = movieId ? getPosition(movieId) : null;
          if (
            saved &&
            saved > 15 &&
            Number.isFinite(v.duration) &&
            saved < v.duration * 0.95
          ) {
            v.currentTime = saved;
          }
          lastPosRef.current = v.currentTime;
        }}
        onTimeUpdate={(e) => {
          setTime(e.currentTarget.currentTime);
          persist(e.currentTarget);
        }}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
      />

      {!started && !error && (
        <button
          type="button"
          aria-label="Смотреть"
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 transition-colors hover:bg-black/30"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent shadow-[0_0_50px_rgba(229,9,20,0.55)] transition-transform hover:scale-110">
            <svg viewBox="0 0 24 24" className="ml-1 h-10 w-10 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}

      {waiting && started && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-white/25 border-t-white" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-base-950 text-center">
          <p className="text-zinc-300">Не удалось загрузить видео</p>
          <button
            type="button"
            onClick={() => location.reload()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Повторить
          </button>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-3 pt-10 transition-all duration-300 ${
          controls || !playing ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <input
          type="range"
          aria-label="Перемотка"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(time, duration || 0)}
          onChange={(e) => {
            const v = videoRef.current;
            if (v) v.currentTime = Number(e.target.value);
            setTime(Number(e.target.value));
          }}
          style={{ background: rangeFill }}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent"
        />

        <div className="mt-2 flex items-center gap-3 text-white">
          <button
            type="button"
            aria-label={playing ? "Пауза" : "Воспроизведение"}
            onClick={togglePlay}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <span className="min-w-[86px] text-xs tabular-nums text-zinc-300">
            {formatTime(time)} / {formatTime(duration)}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={muted ? "Включить звук" : "Выключить звук"}
              onClick={toggleMute}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              {muted || volume === 0 ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A6.99 6.99 0 0 1 19 12zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v2.18c.89.44 1.5 1.35 1.5 2.32s-.61 1.88-1.5 2.32V17a4.5 4.5 0 0 0 2.5-5z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              aria-label="Громкость"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const v = videoRef.current;
                if (!v) return;
                v.volume = Number(e.target.value);
                v.muted = Number(e.target.value) === 0;
              }}
              style={{ background: volFill }}
              className="hidden h-1.5 w-24 cursor-pointer appearance-none rounded-full outline-none sm:block [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent"
            />
          </div>

          <div className="flex-1" />

          {levels.length > 1 && (
            <div ref={qualityRef} className="relative">
              <span className="pointer-events-none absolute -top-6 right-0 whitespace-nowrap text-[11px] font-medium tabular-nums text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
                {qualityBadge}
              </span>
              <button
                type="button"
                aria-label="Качество видео"
                aria-expanded={qualityOpen}
                onClick={() => setQualityOpen((o) => !o)}
                className={`transition-transform hover:scale-110 active:scale-95 ${
                  qualityOpen || selectedLevel !== -1 ? "text-accent" : ""
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                  <path d="M19.14 12.94a7.07 7.07 0 0 0 .06-.94 7.07 7.07 0 0 0-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.28 7.28 0 0 0-1.62-.94l-.36-2.54a.49.49 0 0 0-.49-.42h-3.84a.49.49 0 0 0-.48.42l-.37 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.61.22L2.2 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.12.22.39.31.61.22l2.39-.96c.5.38 1.03.7 1.62.94l.37 2.54c.04.24.24.42.48.42h3.84c.25 0 .46-.18.49-.42l.36-2.54a7.28 7.28 0 0 0 1.62-.94l2.39.96c.22.09.49 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.6A3.6 3.6 0 1 1 15.6 12 3.6 3.6 0 0 1 12 15.6z" />
                </svg>
              </button>

              {qualityOpen && (
                <div className="absolute bottom-full right-0 mb-3 min-w-[170px] overflow-hidden rounded-lg border border-white/10 bg-base-900/95 py-1.5 shadow-2xl backdrop-blur">
                  <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    Качество
                  </p>
                  <button
                    type="button"
                    onClick={() => selectQuality(-1)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors hover:bg-white/10 ${
                      selectedLevel === -1 ? "text-accent" : "text-zinc-200"
                    }`}
                  >
                    <span>
                      Авто
                      {selectedLevel === -1 && activeHeight
                        ? ` · ${activeHeight}p`
                        : ""}
                    </span>
                    {selectedLevel === -1 && <CheckIcon />}
                  </button>

                  {sortedLevels.map((l) => (
                    <button
                      key={l.index}
                      type="button"
                      onClick={() => selectQuality(l.index)}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors hover:bg-white/10 ${
                        selectedLevel === l.index
                          ? "text-accent"
                          : "text-zinc-200"
                      }`}
                    >
                      <span>{levelLabel(l)}</span>
                      {selectedLevel === l.index && <CheckIcon />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            aria-label={fullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
            onClick={toggleFullscreen}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            {fullscreen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}
