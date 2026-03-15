import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, Plus, Trash2, MessageCircle, Send, Loader2, X, ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  announcementService,
  Announcement,
} from '@/services/announcement.service';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ── Create Form ──────────────────────────────────────────────── */
const CreateForm: React.FC<{
  onCreated: (a: Announcement) => void;
  onCancel: () => void;
}> = ({ onCreated, onCancel }) => {
  const [text,         setText]         = useState('');
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickImage = (file: File | null) => {
    setImageFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const ann = await announcementService.create(text.trim(), imageFile);
      onCreated(ann);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-4 rounded-xl border bg-muted/30 p-4 space-y-3">
      <Textarea
        placeholder="Write your announcement…"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        className="resize-none text-sm"
      />

      {/* Image preview */}
      {preview && (
        <div className="relative inline-block">
          <img src={preview} alt="preview" className="max-h-40 rounded-lg object-cover border" />
          <button
            onClick={() => pickImage(null)}
            className="absolute -top-2 -right-2 rounded-full bg-destructive text-white p-0.5"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ImageIcon size={15} /> Add image
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => pickImage(e.target.files?.[0] ?? null)}
        />

        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!text.trim() || submitting}>
            {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ── Single Announcement Card ─────────────────────────────────── */
const AnnouncementCard: React.FC<{
  ann: Announcement;
  currentUserId: string;
  isPrivileged: boolean;
  onChange: (updated: Announcement) => void;
  onDelete: () => void;
}> = ({ ann, currentUserId, isPrivileged, onChange, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText,  setCommentText]  = useState('');
  const [busy,         setBusy]         = useState(false);

  const imageSrc = ann.imageBase64
    ? `data:${ann.imageContentType ?? 'image/jpeg'};base64,${ann.imageBase64}`
    : null;

  const react = async (emoji: string) => {
    try {
      const updated = await announcementService.toggleReaction(ann.id, emoji);
      onChange(updated);
    } catch { /* ignore */ }
  };

  const sendComment = async () => {
    if (!commentText.trim() || busy) return;
    setBusy(true);
    try {
      const updated = await announcementService.addComment(ann.id, commentText.trim());
      onChange(updated);
      setCommentText('');
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      const updated = await announcementService.deleteComment(ann.id, commentId);
      onChange(updated);
    } catch { /* ignore */ }
  };

  const totalReactions = Object.values(ann.reactions ?? {}).reduce((s, a) => s + a.length, 0);
  const commentCount = ann.comments?.length ?? 0;

  return (
    <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-white text-xs font-bold shrink-0">
            {initials(ann.authorName ?? '?')}
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">{ann.authorName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(ann.createdAt)}</p>
          </div>
        </div>
        {isPrivileged && (
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Body */}
      <p className="text-sm whitespace-pre-wrap">{ann.text}</p>

      {/* Image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt="announcement"
          className="rounded-lg max-h-72 w-full object-cover border"
        />
      )}

      {/* Reaction bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {EMOJIS.map(emoji => {
          const reactors = ann.reactions?.[emoji] ?? [];
          const reacted  = reactors.includes(currentUserId);
          return (
            <button
              key={emoji}
              onClick={() => react(emoji)}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors
                ${reacted
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/50 hover:bg-muted'}`}
            >
              {emoji}
              {reactors.length > 0 && <span>{reactors.length}</span>}
            </button>
          );
        })}

        {/* Comment toggle */}
        <button
          onClick={() => setShowComments(v => !v)}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle size={14} />
          {commentCount > 0 ? commentCount : ''} {commentCount === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-2 pt-1 border-t">
          {ann.comments?.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No comments yet.</p>
          )}
          {ann.comments?.map(c => (
            <div key={c.id} className="flex items-start gap-2 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold shrink-0">
                {initials(c.authorName ?? '?')}
              </div>
              <div className="flex-1 rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
                <span className="font-medium text-xs mr-1.5">{c.authorName}</span>
                {c.text}
              </div>
              {(c.authorId === currentUserId || isPrivileged) && (
                <button
                  onClick={() => removeComment(c.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0 mt-1 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}

          {/* Add comment */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
              {initials(currentUserId ?? '?')}
            </div>
            <input
              className="flex-1 rounded-full border bg-muted/50 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              placeholder="Write a comment…"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendComment()}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={sendComment}
              disabled={!commentText.trim() || busy}
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Component ───────────────────────────────────────────── */
const Announcements: React.FC = () => {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'admin';
  const currentUserId = user?.employeeId ?? user?.id ?? '';

  const [items,     setItems]     = useState<Announcement[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);

  useEffect(() => {
    announcementService.getAll()
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (ann: Announcement) => {
    setItems(prev => [ann, ...prev]);
    setShowForm(false);
  };

  const handleChange = (updated: Announcement) =>
    setItems(prev => prev.map(a => a.id === updated.id ? updated : a));

  const handleDelete = async (id: string) => {
    try {
      await announcementService.delete(id);
      setItems(prev => prev.filter(a => a.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone size={18} className="text-primary" /> Announcements
          </CardTitle>
          {isPrivileged && !showForm && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <Plus size={14} className="mr-1" /> New
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Create form */}
        {isPrivileged && showForm && (
          <CreateForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No announcements yet.
            {isPrivileged && ' Click "New" to post one.'}
          </p>
        ) : (
          items.map(ann => (
            <AnnouncementCard
              key={ann.id}
              ann={ann}
              currentUserId={currentUserId}
              isPrivileged={isPrivileged}
              onChange={handleChange}
              onDelete={() => handleDelete(ann.id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default Announcements;
