import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateAllChat, getMessages, sendMessage } from '@/lib/db';

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
    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
