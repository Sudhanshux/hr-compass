import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Clock, LogIn, LogOut, Loader2, AlertCircle,
  CheckCircle2, Navigation, Crosshair, WifiOff, CalendarDays, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceService, AttendanceRecord, PunchRequest } from '@/services/attendance.service';
import { useToast } from '@/hooks/use-toast';

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [record, setRecord]             = useState<AttendanceRecord | null>(null);
  const [history, setHistory]           = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]           = useState(false);
  const [geoLoading, setGeoLoading]     = useState(false);
  const [geoError, setGeoError]         = useState<string | null>(null);
  const [initialLoading, setInitial]    = useState(true);
  const [currentGeo, setCurrentGeo]     = useState<GeoPoint | null>(null);
  const [locating, setLocating]         = useState(false);

  /* ── Fetch today + history on mount ── */
 useEffect(() => {
  if (!user?.employeeId) {
    toast({
      title: 'Punch In Failed',
      description: 'Employee not found',
      variant: 'destructive',
    });
    return;
  }

  (async () => {
    try {
      const [today, histRaw] = await Promise.all([
        attendanceService.getToday(user.employeeId).catch(() => null),
        attendanceService.getHistory(user.employeeId).catch(() => []),
      ]);

      setRecord(today);

      // Cast to any first — avoids TS inferring 'never' from mismatched
      // return type vs catch fallback. Then safely extract the array.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = histRaw as any;
      const histArray: AttendanceRecord[] = Array.isArray(raw)
        ? raw                  // plain array (catch fallback or direct array response)
        : Array.isArray(raw?.content)
          ? raw.content        // Spring Page<T>  →  { content: [...], totalPages, ... }
          : [];                // unknown shape   →  safe empty fallback

      setHistory(histArray);

    } finally {
      setInitial(false);
    }
  })();
}, [user?.employeeId]);
 // re-runs once employeeId is available

  /* ── Background GPS polling ── */
  useEffect(() => {
    if (!navigator.geolocation) return;
    const poll = () => {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCurrentGeo({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
          setLocating(false);
        },
        () => setLocating(false),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
      );
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, []);

  /* ── On-demand location for punch actions ── */
  const getLocation = useCallback((): Promise<PunchRequest> => {
    setGeoLoading(true);
    setGeoError(null);
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation not supported.';
        setGeoError(msg); setGeoLoading(false); reject(new Error(msg)); return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          const geo: GeoPoint = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy };
          setCurrentGeo(geo);
          setGeoLoading(false);
          resolve({ latitude: geo.latitude, longitude: geo.longitude });
        },
        err => {
          setGeoLoading(false);
          const msg = err.code === 1 ? 'Location permission denied. Enable it in browser settings.' :
            err.code === 2 ? 'Location unavailable. Try again.' : 'Location request timed out.';
          setGeoError(msg); reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, []);

  const handlePunchIn = async () => {
    console.log("Logged in user:", user);
     if (!user?.employeeId) {
      toast({
        title: 'Punch In Failed',
        description: 'Employee not found',
        variant: 'destructive',
      });
      return;
    }
    try {
      setLoading(true);
      const loc = await getLocation();
      const result = await attendanceService.punchIn(user.employeeId,loc);
      setRecord(result);
      toast({ title: '✓ Punched In', description: `Recorded at ${formatTime(result.punchInTime)}` });
    } catch (err: any) {
      toast({ title: 'Punch In Failed', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handlePunchOut = async () => {
     if (!user?.employeeId) {
      toast({
        title: 'Punch In Failed',
        description: 'Employee not found',
        variant: 'destructive',
      });
      return;
    }
    try {
      setLoading(true);
      const loc = await getLocation();
      const result = await attendanceService.punchOut(user.employeeId,loc);
      setRecord(result);
      toast({ title: '✓ Punched Out', description: `Total: ${result.workingHours?.toFixed(1)}h` });
    } catch (err: any) {
      toast({ title: 'Punch Out Failed', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const isPunchedIn  = !!record?.punchInTime;
  const isPunchedOut = !!record?.punchOutTime;

  return (
    <div className="min-h-screen bg-white text-slate-800 p-4 md:p-8 space-y-6">
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slide-up 0.3s ease forwards; }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Attendance</h1>
          <p className="text-slate-400 text-sm mt-0.5">{formatDateFull(new Date().toISOString())}</p>
        </div>
        <div className="text-right">
          <LiveClock />
          <div className="flex items-center justify-end gap-1.5 mt-1">
            {locating ? (
              <><Loader2 size={10} className="animate-spin text-blue-400" /><span className="text-[10px] text-blue-500">Locating…</span></>
            ) : currentGeo ? (
              <><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[10px] text-emerald-600 font-medium">GPS Active</span></>
            ) : (
              <><WifiOff size={10} className="text-slate-300" /><span className="text-[10px] text-slate-400">No GPS</span></>
            )}
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — Punch card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 space-y-5">

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Today</span>
              {isPunchedOut ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  <CheckCircle2 size={12} />Day Complete
                </span>
              ) : isPunchedIn ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                  <Clock size={12} className="animate-pulse" />Working
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700">
                  <AlertCircle size={12} />Not Started
                </span>
              )}
            </div>

            {initialLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-slate-300" size={28} />
              </div>
            ) : (
              <>
                {/* Punch time grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Punch In',  time: record?.punchInTime  ?? null, accent: 'text-emerald-600', geo: record?.punchInLocation  as GeoPoint | undefined, dot: 'bg-emerald-500' },
                    { label: 'Punch Out', time: record?.punchOutTime ?? null, accent: 'text-red-500',     geo: record?.punchOutLocation as GeoPoint | undefined, dot: 'bg-red-500' },
                  ].map(({ label, time, accent, geo, dot }) => (
                    <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mb-1">{label}</p>
                      <p className={`text-lg font-mono font-bold ${time ? accent : 'text-slate-200'}`}>
                        {formatTime(time)}
                      </p>
                      {geo && (
                        <p className="text-[9px] text-slate-400 font-mono mt-1.5 flex items-center gap-1">
                          <span className={`inline-block w-1 h-1 rounded-full ${dot}`} />
                          {coordStr(geo)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total hours */}
                {record?.workingHours != null && (
                  <div className="flex items-center justify-between text-sm slide-up">
                    <span className="text-slate-400">Total Hours</span>
                    <span className="font-bold text-slate-800 tabular-nums">{record.workingHours.toFixed(1)}h</span>
                  </div>
                )}

                {/* Progress bar */}
                {record?.workingHours != null && (
                  <div className="slide-up">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                      <span>Day Progress</span>
                      <span>{Math.round(Math.min(100, (record.workingHours / 8) * 100))}% of 8h</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all duration-700"
                        style={{ width: `${Math.min(100, (record.workingHours / 8) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Geo error */}
                {geoError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-600 slide-up">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />{geoError}
                  </div>
                )}

                {/* Action button */}
                <div className="pt-1">
                  {!isPunchedIn ? (
                    <button
                      onClick={handlePunchIn}
                      disabled={loading || geoLoading}
                      className="w-full rounded-xl py-3.5 font-semibold text-sm bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 transition-colors"
                    >
                      {(loading || geoLoading) ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
                      {geoLoading ? 'Getting Location…' : loading ? 'Recording…' : 'Punch In'}
                    </button>
                  ) : !isPunchedOut ? (
                    <button
                      onClick={handlePunchOut}
                      disabled={loading || geoLoading}
                      className="w-full rounded-xl py-3.5 font-semibold text-sm bg-red-500 hover:bg-red-600 active:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-red-200 transition-colors"
                    >
                      {(loading || geoLoading) ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={17} />}
                      {geoLoading ? 'Getting Location…' : loading ? 'Recording…' : 'Punch Out'}
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-xl py-3.5 bg-slate-50 border border-slate-100 text-slate-400 text-sm font-medium">
                      <CheckCircle2 size={16} className="text-emerald-500" />Day Complete
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right — Map + Previous Attendance */}
        <div className="lg:col-span-3 space-y-4">

          {/* Map card */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Crosshair size={14} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">Location Map</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 font-medium">● 20m radius</span>
              </div>
              <div className="flex items-center gap-3">
                {record?.punchInLocation && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />In saved
                  </span>
                )}
                {record?.punchOutLocation && (
                  <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />Out saved
                  </span>
                )}
              </div>
            </div>

            <div className="p-3">
              <MapView
                punchIn={record?.punchInLocation as GeoPoint | undefined}
                punchOut={record?.punchOutLocation as GeoPoint | undefined}
                current={currentGeo}
                height={300}
              />
            </div>

            {/* Location detail rows below map */}
            {(record?.punchInLocation || record?.punchOutLocation || currentGeo) && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {currentGeo && !isPunchedIn && (
                  <div className="flex items-center gap-3 px-5 py-3">
                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white p-1.5 shrink-0">
                      <HumanIcon className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-600">Current Position</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{coordStr(currentGeo)}</p>
                    </div>
                    {currentGeo.accuracy && (
                      <span className="text-[10px] text-slate-400 shrink-0">±{Math.round(currentGeo.accuracy)}m</span>
                    )}
                  </div>
                )}
                {record?.punchInLocation && (
                  <LocationRow
                    label="Punch In Location"
                    geo={record.punchInLocation as GeoPoint}
                    time={record.punchInTime}
                    bgColor="bg-emerald-500"
                  />
                )}
                {record?.punchOutLocation && (
                  <LocationRow
                    label="Punch Out Location"
                    geo={record.punchOutLocation as GeoPoint}
                    time={record.punchOutTime}
                    bgColor="bg-red-500"
                  />
                )}
              </div>
            )}
          </div>

          {/* Previous Attendance */}
          <PreviousAttendance history={history} />
        </div>
      </div>
    </div>
  );
};


/* ─── Types ──────────────────────────────────────────────────────────────── */
interface GeoPoint { latitude: number; longitude: number; accuracy?: number }

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const formatTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--';

const formatDateFull = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const coordStr = (pt: GeoPoint) => `${pt.latitude.toFixed(5)}, ${pt.longitude.toFixed(5)}`;

/* ─── Live Clock ─────────────────────────────────────────────────────────── */
const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono tabular-nums text-slate-800 text-2xl font-light">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
};

/* ─── Inline Human SVG (no external icon dependency needed) ──────────────── */
const HumanIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="6" r="3.2" />
    <path d="M12 11c-3.8 0-6.2 1.9-6.2 4.3V18h12.4v-2.7C18.2 12.9 15.8 11 12 11z" />
  </svg>
);

/* ─── Degrees per metre (approximate, equirectangular) ───────────────────── */
const metresToDeg = (metres: number, lat: number) => ({
  lat: metres / 111320,
  lng: metres / (111320 * Math.cos((lat * Math.PI) / 180)),
});

/* ─── Map Component ──────────────────────────────────────────────────────── */
interface MapViewProps {
  punchIn?: GeoPoint | null;
  punchOut?: GeoPoint | null;
  current?: GeoPoint | null;
  height?: number;
}

const MapView: React.FC<MapViewProps> = ({ punchIn, punchOut, current, height = 300 }) => {
  const center = current ?? punchIn ?? punchOut;

  if (!center) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-3 rounded-xl bg-slate-50 border border-slate-200"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
            <HumanIcon className="w-8 h-8" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-slate-200 animate-ping" style={{ animationDuration: '2.5s' }} />
        </div>
        <p className="text-xs text-slate-400 tracking-widest uppercase">Awaiting location</p>
      </div>
    );
  }

  const { latitude: lat, longitude: lng } = center;

  /* Tight bbox for zoom-level ~18 (~250m each side) */
  const delta = 0.0023;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik`;

  /* 20m circle: convert to percentage of the bbox width/height */
  const { lat: latDeg, lng: lngDeg } = metresToDeg(20, lat);
  const bboxSpan = delta * 2;
  /* Average x/y radii for a roughly circular ellipse on the SVG viewBox */
  const rX = ((lngDeg / bboxSpan) * 100).toFixed(2);
  const rY = ((latDeg / bboxSpan) * 100).toFixed(2);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>

      {/* OSM iframe — light/default tile, no colour filter */}
      <iframe
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        title="Location Map"
      />

      {/* SVG overlay for 20m accuracy circle */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <ellipse
          cx="50" cy="50"
          rx={rX} ry={rY}
          fill="rgba(59,130,246,0.10)"
          stroke="rgba(59,130,246,0.50)"
          strokeWidth="0.35"
        />
      </svg>

      {/* Human pin — centred over the location */}
      <div
        className="absolute pointer-events-none flex flex-col items-center"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -100%)' }}
      >
        <div
          className="w-9 h-9 rounded-full border-[2.5px] border-white shadow-md flex items-center justify-center text-white p-1.5"
          style={{ backgroundColor: punchOut ? '#ef4444' : punchIn ? '#10b981' : '#3b82f6' }}
        >
          <HumanIcon className="w-full h-full" />
        </div>
        {/* Drop shadow tail */}
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `8px solid ${punchOut ? '#ef4444' : punchIn ? '#10b981' : '#3b82f6'}`,
            marginTop: '-1px',
            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.15))',
          }}
        />
      </div>

      {/* Legend — top left */}
      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
        {current && !punchIn && (
          <LegendPill color="bg-blue-500" label="You are here" pulse />
        )}
        {punchIn && (
          <LegendPill color="bg-emerald-500" label="Punch In" />
        )}
        {punchOut && (
          <LegendPill color="bg-red-500" label="Punch Out" />
        )}
      </div>

      {/* Coords + radius label — bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-transparent px-3 py-2">
        <p className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
          <Navigation size={9} className="text-slate-400" />
          {coordStr(center)}
          {center.accuracy && <span className="text-slate-400">±{Math.round(center.accuracy)}m</span>}
          <span className="ml-auto text-blue-500 font-semibold flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 opacity-60" />
            20m radius
          </span>
        </p>
      </div>
    </div>
  );
};

const LegendPill: React.FC<{ color: string; label: string; pulse?: boolean }> = ({ color, label, pulse }) => (
  <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm border border-slate-100">
    <div className={`w-2 h-2 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />
    <span className="text-[10px] text-slate-600 font-medium">{label}</span>
  </div>
);

/* ─── Location Detail Row ────────────────────────────────────────────────── */
const LocationRow: React.FC<{ label: string; geo: GeoPoint; time: string | null; bgColor: string }> = ({
  label, geo, time, bgColor,
}) => (
  <div className="flex items-center gap-3 px-5 py-3">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white p-1.5 ${bgColor}`}>
      <HumanIcon className="w-full h-full" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{coordStr(geo)}</p>
    </div>
    {time && <span className="text-[10px] text-slate-400 shrink-0 tabular-nums font-mono">{formatTime(time)}</span>}
  </div>
);

/* ─── Previous Attendance Component ──────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  present:    { label: 'Present',  bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'half-day': { label: 'Half Day', bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400' },
  'on-leave': { label: 'On Leave', bg: 'bg-sky-50',      text: 'text-sky-700',     dot: 'bg-sky-500' },
  absent:     { label: 'Absent',   bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500' },
};

const PreviousAttendance: React.FC<{ history: AttendanceRecord[] }> = ({ history }) => {
  const counts = {
    present:  history.filter(r => r.status === 'PRESENT').length,
    halfDay:  history.filter(r => r.status === 'ABSENT').length,
    onLeave:  history.filter(r => r.status === 'ON_LEAVE').length,
    absent:   history.filter(r => r.status === 'ABSENT').length,
  };
  const total = history.length;
  const pct = total > 0 ? Math.round((counts.present / total) * 100) : 0;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Previous Attendance</span>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">{pct}% rate</span>
          </div>
        )}
      </div>

      {/* Summary counts */}
      {total > 0 && (
        <div className="grid grid-cols-4 border-b border-slate-100 divide-x divide-slate-100">
          {[
            { label: 'Present',  n: counts.present,  dot: 'bg-emerald-500' },
            { label: 'Half Day', n: counts.halfDay,  dot: 'bg-amber-400' },
            { label: 'On Leave', n: counts.onLeave,  dot: 'bg-sky-500' },
            { label: 'Absent',   n: counts.absent,   dot: 'bg-red-500' },
          ].map(({ label, n, dot }) => (
            <div key={label} className="flex flex-col items-center py-3">
              <div className={`w-2 h-2 rounded-full ${dot} mb-1.5`} />
              <span className="text-lg font-bold text-slate-800">{n}</span>
              <span className="text-[9px] text-slate-400 mt-0.5">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stacked progress bar */}
      {total > 0 && (
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex rounded-full overflow-hidden h-2 bg-slate-100 gap-px">
            {counts.present > 0 && <div className="bg-emerald-500" style={{ width: `${(counts.present / total) * 100}%` }} />}
            {counts.halfDay > 0 && <div className="bg-amber-400" style={{ width: `${(counts.halfDay / total) * 100}%` }} />}
            {counts.onLeave > 0 && <div className="bg-sky-400" style={{ width: `${(counts.onLeave / total) * 100}%` }} />}
            {counts.absent  > 0 && <div className="bg-red-400"  style={{ width: `${(counts.absent  / total) * 100}%` }} />}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">{total} working days recorded</p>
        </div>
      )}

      {/* Row list */}
      <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
        {history.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No previous records found</p>
        ) : (
          history.slice(0, 20).map((rec) => {
            const cfg = STATUS_CFG[rec.status] ?? { label: rec.status, bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-300' };
            const d = new Date(rec.date);
            return (
              <div
                key={rec.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/70 transition-colors"
              >
                {/* Day bubble + times */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] text-slate-400 uppercase leading-none">
                      {d.toLocaleDateString([], { weekday: 'short' })}
                    </span>
                    <span className="text-sm font-bold text-slate-700 leading-tight">{d.getDate()}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {d.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {formatTime(rec.punchInTime)} → {formatTime(rec.punchOutTime)}
                      {rec.workingHours != null && (
                        <span className="ml-1.5 text-slate-300">· {rec.workingHours.toFixed(1)}h</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────────────── */


export default AttendancePage;
