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

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch today's record & history
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [today, hist] = await Promise.all([
          attendanceService.getToday().catch(() => null),
          attendanceService.getHistory().catch(() => []),
        ]);
        setRecord(today);
        setHistory(hist);
      } catch {
        // silent
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

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
          const msg = err.code === 1 ? 'Location permission denied. Please enable it in browser settings.' :
            err.code === 2 ? 'Location unavailable. Please try again.' :
            'Location request timed out. Please try again.';
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

              {/* Time Display */}
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Punch In</p>
                  <p className="text-2xl font-bold">{formatTime(record?.punchInTime ?? null)}</p>
                  {record?.punchInLocation && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <MapPin size={10} />
                      {record.punchInLocation.latitude.toFixed(4)}, {record.punchInLocation.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Punch Out</p>
                  <p className="text-2xl font-bold">{formatTime(record?.punchOutTime ?? null)}</p>
                  {record?.punchOutLocation && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <MapPin size={10} />
                      {record.punchOutLocation.latitude.toFixed(4)}, {record.punchOutLocation.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              {/* Total Hours */}
              {record?.totalHours != null && (
                <p className="text-sm text-muted-foreground">
                  Total Hours: <span className="font-semibold text-foreground">{record.totalHours.toFixed(1)}h</span>
                </p>
              )}

              {/* Geo Error */}
              {geoError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle size={14} /> {geoError}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {!isPunchedIn && (
                  <Button
                    size="lg"
                    onClick={handlePunchIn}
                    disabled={loading || geoLoading}
                    className="gap-2"
                  >
                    {loading || geoLoading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                    Punch In
                  </Button>
                )}
                {isPunchedIn && !isPunchedOut && (
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={handlePunchOut}
                    disabled={loading || geoLoading}
                    className="gap-2"
                  >
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
                  <div>
                    <p className="font-medium text-sm">{formatDate(rec.date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(rec.punchInTime)} — {formatTime(rec.punchOutTime)}
                      {rec.totalHours != null && ` · ${rec.totalHours.toFixed(1)}h`}
                    </p>
                  </div>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
