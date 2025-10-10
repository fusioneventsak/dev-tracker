import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateAllChat, getMessages, sendMessage, createNotification } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

// GET /api/chat - Get or create the "All Team" chat and return its messages
export async function GET() {
  try {
    const chat = await getOrCreateAllChat();
    const messages = await getMessages(chat.id);

    return NextResponse.json({
      chatId: chat.id,
      messages
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    );
  }
}

// POST /api/chat - Send a message
export async function POST(request: NextRequest) {
  try {
    const { chatId, content, replyTo } = await request.json();

    if (!chatId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Chat ID and content are required' },
        { status: 400 }
      );
    }

    const message = await sendMessage(chatId, content.trim(), replyTo || null);

    // Create notifications for other chat participants
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Get sender's profile
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .single();

      const senderName = senderProfile?.name || senderProfile?.email?.split('@')[0] || 'Someone';

      // Get all chat participants except the sender
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chatId)
        .neq('user_id', user.id);

      // Create notification for each participant
      if (participants) {
        for (const participant of participants) {
          await createNotification({
            userId: participant.user_id,
            type: 'chat_message',
            title: `New message from ${senderName}`,
            message: content.trim().substring(0, 100) + (content.length > 100 ? '...' : ''),
            link: '/?chat=open',
            metadata: {
              chatId,
              messageId: message.id,
              senderId: user.id,
              senderName,
            },
          });
        }
      }
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
