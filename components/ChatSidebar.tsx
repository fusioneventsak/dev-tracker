'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Paperclip, Loader2, Download, Maximize2, Reply, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Message, MessageFile } from '@/lib/types';
import { format } from 'date-fns';

// Image Preview Component
function ImagePreview({
  file,
  isOwnMessage,
  onExpand,
  onDownload,
  supabase
}: {
  file: MessageFile;
  isOwnMessage: boolean;
  onExpand: () => void;
  onDownload: () => void;
  supabase: ReturnType<typeof createClient>;
}) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImage() {
      const { data } = await supabase.storage
        .from('chat-files')
        .createSignedUrl(file.storagePath, 3600);

      if (data?.signedUrl) {
        setImageUrl(data.signedUrl);
      }
      setLoading(false);
    }
    loadImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.storagePath]);

  if (loading) {
    return (
      <div className={`w-48 h-32 rounded flex items-center justify-center ${
        isOwnMessage ? 'bg-blue-500' : 'bg-muted'
      }`}>
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={file.fileName}
        className="max-w-[180px] max-h-[180px] rounded cursor-pointer hover:opacity-90 transition object-cover"
        onClick={onExpand}
      />

      {/* Overlay buttons on hover */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded">
        <button
          onClick={onExpand}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
          title="Expand"
        >
          <Maximize2 className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={onDownload}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
          title="Download"
        >
          <Download className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* File info below image */}
      <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-muted-foreground'}`}>
        {file.fileName} • {(file.fileSize / 1024).toFixed(1)} KB
      </div>
    </div>
  );
}

export default function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{ file: MessageFile; url: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Initialize chat and load messages
  useEffect(() => {
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          // Fetch the new message with files and reactions
          const { data } = await supabase
            .from('messages')
            .select('*, message_files (*), message_reactions (*)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            // Get current user to determine if this is their message
            const { data: { user } } = await supabase.auth.getUser();
            const isOwnMessage = data.sender_id === user?.id;

            // Fetch sender's name from profiles table if not own message
            let senderName = isOwnMessage ? (user?.email || 'You') : 'Unknown';
            if (!isOwnMessage) {
              const { data: senderData } = await supabase
                .from('profiles')
                .select('name, email')
                .eq('id', data.sender_id)
                .single();

              if (senderData) {
                senderName = senderData.name || senderData.email?.split('@')[0] || 'Unknown';
              }
            }

            const newMsg: Message = {
              id: data.id,
              chatId: data.chat_id,
              senderId: data.sender_id,
              content: data.content,
              replyTo: data.reply_to,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
              isDeleted: data.is_deleted,
              senderEmail: senderName,
              files: data.message_files?.map((f: MessageFile & { message_id: string; file_name: string; file_size: number; file_type: string; storage_path: string; uploaded_at: string }) => ({
                id: f.id,
                messageId: f.message_id,
                fileName: f.file_name,
                fileSize: f.file_size,
                fileType: f.file_type,
                storagePath: f.storage_path,
                uploadedAt: f.uploaded_at
              })) || [],
              reactions: data.message_reactions?.map((r: { id: string; message_id: string; user_id: string; reaction: string; created_at: string }) => ({
                id: r.id,
                messageId: r.message_id,
                userId: r.user_id,
                reaction: r.reaction,
                createdAt: r.created_at
              })) || []
            };
            // Only add if not already in the list (prevents duplicates from optimistic updates)
            setMessages((prev) => {
              const exists = prev.some(m => m.id === newMsg.id);
              if (exists) {
                // Update existing message with files if it exists
                return prev.map(m => m.id === newMsg.id ? newMsg : m);
              }
              return [...prev, newMsg];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_files',
        },
        async (payload) => {
          // When a file is uploaded, update the corresponding message
          const messageId = payload.new.message_id;
          const { data } = await supabase
            .from('messages')
            .select('*, message_files (*), message_reactions (*)')
            .eq('id', messageId)
            .eq('chat_id', chatId)
            .single();

          if (data) {
            const { data: { user } } = await supabase.auth.getUser();
            const isOwnMessage = data.sender_id === user?.id;

            // Fetch sender's name from profiles table if not own message
            let senderName = isOwnMessage ? (user?.email || 'You') : 'Unknown';
            if (!isOwnMessage) {
              const { data: senderData } = await supabase
                .from('profiles')
                .select('name, email')
                .eq('id', data.sender_id)
                .single();

              if (senderData) {
                senderName = senderData.name || senderData.email?.split('@')[0] || 'Unknown';
              }
            }

            const updatedMsg: Message = {
              id: data.id,
              chatId: data.chat_id,
              senderId: data.sender_id,
              content: data.content,
              replyTo: data.reply_to,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
              isDeleted: data.is_deleted,
              senderEmail: senderName,
              files: data.message_files?.map((f: MessageFile & { message_id: string; file_name: string; file_size: number; file_type: string; storage_path: string; uploaded_at: string }) => ({
                id: f.id,
                messageId: f.message_id,
                fileName: f.file_name,
                fileSize: f.file_size,
                fileType: f.file_type,
                storagePath: f.storage_path,
                uploadedAt: f.uploaded_at
              })) || [],
              reactions: data.message_reactions?.map((r: { id: string; message_id: string; user_id: string; reaction: string; created_at: string }) => ({
                id: r.id,
                messageId: r.message_id,
                userId: r.user_id,
                reaction: r.reaction,
                createdAt: r.created_at
              })) || []
            };

            setMessages((prev) => prev.map(m => m.id === messageId ? updatedMsg : m));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
        },
        async (payload) => {
          // When a reaction is added, update the corresponding message
          const messageId = payload.new.message_id;
          const { data } = await supabase
            .from('message_reactions')
            .select('*')
            .eq('message_id', messageId);

          if (data) {
            setMessages((prev) => prev.map(m =>
              m.id === messageId
                ? {
                    ...m,
                    reactions: data.map((r: { id: string; message_id: string; user_id: string; reaction: string; created_at: string }) => ({
                      id: r.id,
                      messageId: r.message_id,
                      userId: r.user_id,
                      reaction: r.reaction,
                      createdAt: r.created_at
                    }))
                  }
                : m
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'message_reactions',
        },
        async (payload) => {
          // When a reaction is removed, update the corresponding message
          const messageId = payload.old.message_id;
          const { data } = await supabase
            .from('message_reactions')
            .select('*')
            .eq('message_id', messageId);

          setMessages((prev) => prev.map(m =>
            m.id === messageId
              ? {
                  ...m,
                  reactions: data?.map((r: { id: string; message_id: string; user_id: string; reaction: string; created_at: string }) => ({
                    id: r.id,
                    messageId: r.message_id,
                    userId: r.user_id,
                    reaction: r.reaction,
                    createdAt: r.created_at
                  })) || []
                }
              : m
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, supabase]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  async function initializeChat() {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
        setCurrentUserId(user.id);
      }

      // Get or create the "All Team" chat via API
      const response = await fetch('/api/chat');
      if (!response.ok) throw new Error('Failed to fetch chat');

      const data = await response.json();
      setChatId(data.chatId);
      setMessages(data.messages);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  }

  function removeFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function uploadFiles(messageId: string): Promise<void> {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${messageId}-${Date.now()}.${fileExt}`;
        const filePath = `chat-files/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Store file reference in message_files table
        const { error: dbError } = await supabase
          .from('message_files')
          .insert({
            message_id: messageId,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: filePath
          });

        if (dbError) throw dbError;
      }
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  }

  function handleReply(message: Message) {
    setReplyingTo(message);
  }

  function cancelReply() {
    setReplyingTo(null);
  }

  async function toggleReaction(messageId: string, reaction: string) {
    try {
      // Check if user already reacted with this emoji
      const message = messages.find(m => m.id === messageId);
      const existingReaction = message?.reactions?.find(
        r => r.userId === currentUserId && r.reaction === reaction
      );

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Add reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUserId,
            reaction
          });
      }

      setShowReactionPicker(null);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !chatId || sending) return;

    const messageContent = newMessage.trim() || '📎 File(s) attached';
    const replyToId = replyingTo?.id || null;

    setNewMessage(''); // Clear input immediately for better UX
    setReplyingTo(null); // Clear reply state

    try {
      setSending(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          content: messageContent,
          replyTo: replyToId
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Get the sent message from the response
      const sentMessage = await response.json();

      // Upload files if any
      if (selectedFiles.length > 0) {
        await uploadFiles(sentMessage.id);
      }

      // Optimistically add the message to UI immediately
      // (Real-time subscription will handle duplicates/updates)
      setMessages((prev) => {
        // Check if message already exists (from real-time)
        const exists = prev.some(m => m.id === sentMessage.id);
        if (exists) return prev;
        return [...prev, sentMessage];
      });

    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message on error
      setNewMessage(messageContent);
      if (replyToId) {
        const originalMessage = messages.find(m => m.id === replyToId);
        if (originalMessage) setReplyingTo(originalMessage);
      }
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatTime(dateString: string) {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return '';
    }
  }

  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return format(date, 'MMM d, yyyy');
      }
    } catch {
      return '';
    }
  }

  function isImageFile(file: MessageFile): boolean {
    return file.fileType.startsWith('image/');
  }

  async function getFileUrl(file: MessageFile): Promise<string> {
    const { data } = await supabase.storage
      .from('chat-files')
      .createSignedUrl(file.storagePath, 3600); // 1 hour expiry
    return data?.signedUrl || '';
  }

  async function handleDownloadFile(file: MessageFile) {
    const { data, error } = await supabase.storage
      .from('chat-files')
      .download(file.storagePath);

    if (error) {
      console.error('Download error:', error);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleExpandImage(file: MessageFile) {
    const url = await getFileUrl(file);
    setExpandedImage({ file, url });
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <>
      {/* Expanded Image Modal */}
      {expandedImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 overflow-auto">
          <div className="relative max-w-7xl w-full my-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 text-white sticky top-0 bg-black/50 p-2 rounded backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{expandedImage.file.fileName}</span>
                <span className="text-xs opacity-70">
                  {(expandedImage.file.fileSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadFile(expandedImage.file)}
                  className="p-2 hover:bg-white/10 rounded transition"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setExpandedImage(null)}
                  className="p-2 hover:bg-white/10 rounded transition"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image - scrollable */}
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={expandedImage.url}
                alt={expandedImage.file.fileName}
                className="max-w-full h-auto rounded"
              />
            </div>
          </div>

          {/* Click backdrop to close */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setExpandedImage(null)}
          />
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all ${
          isOpen ? 'right-[25rem]' : 'right-6'
        }`}
        aria-label="Toggle chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-background border-l border-border z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Team Chat
            </h2>
            <p className="text-sm text-muted-foreground">All team members</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  {/* Date divider */}
                  <div className="flex items-center justify-center my-4">
                    <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                      {date}
                    </div>
                  </div>

                  {/* Messages for this date */}
                  {msgs.map((message) => {
                    const isOwnMessage = message.senderEmail === currentUserEmail;
                    const repliedMsg = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 group`}
                      >
                        <div className="relative">
                          <div
                            className={`max-w-[75%] rounded-lg px-3 py-2 ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            {!isOwnMessage && (
                              <div className="text-xs font-medium mb-1 opacity-70">
                                {message.senderEmail?.split('@')[0]}
                              </div>
                            )}

                            {/* Replied message preview */}
                            {repliedMsg && (
                              <div className={`text-xs mb-2 pb-2 border-b ${
                                isOwnMessage ? 'border-blue-400' : 'border-border'
                              } opacity-70`}>
                                <Reply className="w-3 h-3 inline mr-1" />
                                <span className="font-medium">{repliedMsg.senderEmail?.split('@')[0]}: </span>
                                <span className="line-clamp-1">{repliedMsg.content}</span>
                              </div>
                            )}

                            <div className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </div>

                            {/* File attachments */}
                            {message.files && message.files.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.files.map((file) => {
                                  if (isImageFile(file)) {
                                    return (
                                      <ImagePreview
                                        key={file.id}
                                        file={file}
                                        isOwnMessage={isOwnMessage}
                                        onExpand={() => handleExpandImage(file)}
                                        onDownload={() => handleDownloadFile(file)}
                                        supabase={supabase}
                                      />
                                    );
                                  } else {
                                    return (
                                      <div
                                        key={file.id}
                                        className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                                          isOwnMessage
                                            ? 'bg-blue-500'
                                            : 'bg-background'
                                        }`}
                                      >
                                        <Paperclip className="w-3 h-3" />
                                        <span className="truncate flex-1">{file.fileName}</span>
                                        <span className="text-xs opacity-70">
                                          ({(file.fileSize / 1024).toFixed(1)} KB)
                                        </span>
                                        <button
                                          onClick={() => handleDownloadFile(file)}
                                          className="hover:opacity-70"
                                          title="Download"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                      </div>
                                    );
                                  }
                                })}
                              </div>
                            )}

                            {/* Reactions */}
                            {message.reactions && message.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(
                                  message.reactions.reduce((acc, r) => {
                                    acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                                    return acc;
                                  }, {} as Record<string, number>)
                                ).map(([reaction, count]) => {
                                  const userReacted = message.reactions?.some(
                                    r => r.reaction === reaction && r.userId === currentUserId
                                  );
                                  return (
                                    <button
                                      key={reaction}
                                      onClick={() => toggleReaction(message.id, reaction)}
                                      className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 transition ${
                                        userReacted
                                          ? isOwnMessage ? 'bg-blue-500' : 'bg-blue-100 dark:bg-blue-900'
                                          : isOwnMessage ? 'bg-blue-700 hover:bg-blue-500' : 'bg-background hover:bg-muted'
                                      }`}
                                      title={`${count} reaction${count > 1 ? 's' : ''}`}
                                    >
                                      <span>{reaction}</span>
                                      <span className={isOwnMessage ? 'text-blue-100' : 'text-muted-foreground'}>
                                        {count}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            <div
                              className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-muted-foreground'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </div>
                          </div>

                          {/* Action buttons (shown on hover) */}
                          <div className={`absolute top-0 ${isOwnMessage ? 'left-[-80px]' : 'right-[-80px]'} opacity-0 group-hover:opacity-100 transition flex gap-1`}>
                            <button
                              onClick={() => handleReply(message)}
                              className="p-1 bg-background border border-border rounded hover:bg-muted transition"
                              title="Reply"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                              className="p-1 bg-background border border-border rounded hover:bg-muted transition"
                              title="React"
                            >
                              <Smile className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Reaction picker */}
                          {showReactionPicker === message.id && (
                            <div className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} bottom-full mb-2 p-2 bg-popover border border-border rounded-lg shadow-lg flex gap-1 z-10`}>
                              {['👍', '❤️', '😂', '😮', '😢', '🎉'].map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(message.id, emoji)}
                                  className="text-xl hover:scale-125 transition p-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
            {/* Reply Preview */}
            {replyingTo && (
              <div className="mb-2 flex items-center justify-between px-3 py-2 bg-muted rounded-lg text-sm">
                <div className="flex items-center gap-2 flex-1">
                  <Reply className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">
                      Replying to {replyingTo.senderEmail?.split('@')[0]}
                    </div>
                    <div className="text-sm truncate">{replyingTo.content}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cancelReply}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  title="Cancel reply"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg text-sm"
                  >
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full px-3 py-2 bg-muted border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  disabled={sending || uploading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Attach files"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10"
                  disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || uploading}
                >
                  {sending || uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
