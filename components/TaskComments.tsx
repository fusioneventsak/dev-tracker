'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskComment } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Trash2, Send } from 'lucide-react';

interface TaskCommentsProps {
  taskId: string;
  currentUser?: string;
}

export default function TaskComments({ taskId, currentUser = 'Anonymous' }: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  async function fetchComments() {
    try {
      const res = await fetch(`/api/comments?taskId=${taskId}`);
      if (res.status === 401) {
        setError('Please sign in to view comments.');
        setComments([]);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      } else {
        const { error } = await res.json().catch(() => ({ error: 'Failed to fetch comments' }));
        setError(error || 'Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          author: currentUser,
          content: newComment.trim()
        })
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Failed to save comment' }));
        setError(errorData.message || 'Failed to save comment. Please try again.');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  if (isLoading) {
    return <div className="text-slate-400 text-sm">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-blue-400" />
        <h3 className="font-semibold text-slate-100">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">
            No comments yet. Be the first to add feedback!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                    {getInitials(comment.author)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100 text-sm">
                      {comment.author}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <div className="space-y-2">
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-md p-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as React.FormEvent);
              }
            }}
            placeholder="Add a comment..."
            className="flex-1 bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
            disabled={isSubmitting}
          />
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Posting as: <span className="text-blue-400 font-medium">{currentUser}</span>
        </p>
      </div>
    </div>
  );
}
