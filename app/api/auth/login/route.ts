import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    console.log('Login attempt for:', email);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase auth error:', error.message, error.status);

      // Provide more helpful error messages
      let userMessage = error.message;
      if (error.message === 'Invalid login credentials') {
        userMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please verify your email address before logging in.';
      }

      return NextResponse.json(
        { error: userMessage },
        { status: 401 }
      );
    }

    console.log('Login successful for:', email);

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
