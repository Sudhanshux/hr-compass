import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, LogIn, LogOut, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceService, AttendanceRecord, PunchRequest } from '@/services/attendance.service';
import { useToast } from '@/hooks/use-toast';

const formatTime = (iso: string | null) => {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

const calcHours = (punchIn: string | null, punchOut: string | null): string | null => {
  if (!punchIn) return null;
  const end = punchOut ? new Date(punchOut) : new Date();
  const diff = (end.getTime() - new Date(punchIn).getTime()) / (1000 * 60 * 60);
  const h = Math.floor(diff);
  const m = Math.round((diff - h) * 60);
  return `${h}h ${m}m`;
};

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await res.json();
    if (data.display_name) {
      const parts = data.display_name.split(',').slice(0, 3).join(',');
      return parts;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [punchInAddress, setPunchInAddress] = useState<string | null>(null);
  const [punchOutAddress, setPunchOutAddress] = useState<string | null>(null);
  const [liveHours, setLiveHours] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [today, hist] = await Promise.all([
          attendanceService.getToday().catch(() => null),
          attendanceService.getHistory().catch(() => []),
        ]);
        setRecord(today);
        setHistory(hist);
        if (today?.punchInLocation) {
          reverseGeocode(today.punchInLocation.latitude, today.punchInLocation.longitude).then(setPunchInAddress);
        }
        if (today?.punchOutLocation) {
          reverseGeocode(today.punchOutLocation.latitude, today.punchOutLocation.longitude).then(setPunchOutAddress);
        }
      } catch {
        // silent
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  // Live timer for working hours
  useEffect(() => {
    if (!record?.punchInTime || record?.punchOutTime) {
      setLiveHours(null);
      return;
    }
    const update = () => setLiveHours(calcHours(record.punchInTime, null));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [record?.punchInTime, record?.punchOutTime]);

  const getLocation = useCallback((): Promise<PunchRequest> => {
    setGeoLoading(true);
    setGeoError(null);
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setGeoError('Geolocation is not supported by your browser.');
        setGeoLoading(false);
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLoading(false);
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => {
          setGeoLoading(false);
          const msg = err.code === 1 ? 'Location permission denied.' :
            err.code === 2 ? 'Location unavailable.' : 'Location request timed out.';
          setGeoError(msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const handlePunchIn = async () => {
    try {
      setLoading(true);
      const loc = await getLocation();
      const result = await attendanceService.punchIn(loc);
      setRecord(result);
      reverseGeocode(loc.latitude, loc.longitude).then(setPunchInAddress);
      toast({ title: 'Punched In!', description: `Recorded at ${formatTime(result.punchInTime)}` });
    } catch (err: any) {
      toast({ title: 'Punch In Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setLoading(true);
      const loc = await getLocation();
      const result = await attendanceService.punchOut(loc);
      setRecord(result);
      reverseGeocode(loc.latitude, loc.longitude).then(setPunchOutAddress);
      toast({ title: 'Punched Out!', description: `Total: ${result.totalHours?.toFixed(1)}h` });
    } catch (err: any) {
      toast({ title: 'Punch Out Failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const isPunchedIn = !!record?.punchInTime;
  const isPunchedOut = !!record?.punchOutTime;
  const now = new Date();
  const todayStr = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground">{todayStr}</p>
      </div>

      {/* Punch In / Out Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {initialLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 py-4">
              {/* Status */}
              <div className="flex items-center gap-3">
                {isPunchedOut ? (
                  <Badge className="bg-success/10 text-success border-0 text-sm px-3 py-1">
                    <CheckCircle2 size={14} className="mr-1" /> Day Complete
                  </Badge>
                ) : isPunchedIn ? (
                  <Badge className="bg-info/10 text-info border-0 text-sm px-3 py-1">
                    <Clock size={14} className="mr-1" /> Working
                  </Badge>
                ) : (
                  <Badge className="bg-warning/10 text-warning border-0 text-sm px-3 py-1">
                    <AlertCircle size={14} className="mr-1" /> Not Punched In
                  </Badge>
                )}
              </div>

              {/* Live Working Hours */}
              {isPunchedIn && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {isPunchedOut ? 'Total Working Hours' : 'Working Since'}
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {isPunchedOut
                      ? calcHours(record?.punchInTime ?? null, record?.punchOutTime ?? null)
                      : liveHours ?? '--'}
                  </p>
                </div>
              )}

              {/* Time Display */}
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Punch In</p>
                  <p className="text-2xl font-bold">{formatTime(record?.punchInTime ?? null)}</p>
                  {punchInAddress && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1 max-w-[200px] mx-auto">
                      <MapPin size={10} className="shrink-0" />
                      <span className="truncate">{punchInAddress}</span>
                    </p>
                  )}
                  {!punchInAddress && record?.punchInLocation && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <MapPin size={10} />
                      {record.punchInLocation.latitude.toFixed(4)}, {record.punchInLocation.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Punch Out</p>
                  <p className="text-2xl font-bold">{formatTime(record?.punchOutTime ?? null)}</p>
                  {punchOutAddress && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1 max-w-[200px] mx-auto">
                      <MapPin size={10} className="shrink-0" />
                      <span className="truncate">{punchOutAddress}</span>
                    </p>
                  )}
                  {!punchOutAddress && record?.punchOutLocation && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <MapPin size={10} />
                      {record.punchOutLocation.latitude.toFixed(4)}, {record.punchOutLocation.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              {/* Geo Error */}
              {geoError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle size={14} /> {geoError}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {!isPunchedIn && (
                  <Button size="lg" onClick={handlePunchIn} disabled={loading || geoLoading} className="gap-2">
                    {loading || geoLoading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                    Punch In
                  </Button>
                )}
                {isPunchedIn && !isPunchedOut && (
                  <Button size="lg" variant="destructive" onClick={handlePunchOut} disabled={loading || geoLoading} className="gap-2">
                    {loading || geoLoading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                    Punch Out
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Recent Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No attendance records found.</p>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 10).map((rec) => (
                <div key={rec.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{formatDate(rec.date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(rec.punchInTime)} — {formatTime(rec.punchOutTime)}
                    </p>
                    {rec.punchInLocation && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={9} className="shrink-0" />
                        <span className="truncate">
                          {rec.punchInLocation.latitude.toFixed(4)}, {rec.punchInLocation.longitude.toFixed(4)}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {(rec.totalHours != null || (rec.punchInTime && rec.punchOutTime)) && (
                      <span className="text-xs font-medium text-foreground bg-muted px-2 py-1 rounded-md">
                        {rec.totalHours != null
                          ? `${rec.totalHours.toFixed(1)}h`
                          : calcHours(rec.punchInTime, rec.punchOutTime)}
                      </span>
                    )}
                    <Badge
                      className={`border-0 text-xs ${
                        rec.status === 'present' ? 'bg-success/10 text-success' :
                        rec.status === 'half-day' ? 'bg-warning/10 text-warning' :
                        rec.status === 'on-leave' ? 'bg-info/10 text-info' :
                        'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {rec.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
