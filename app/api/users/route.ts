import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current logged in user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: true });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    return NextResponse.json({
      currentUser: {
        id: user.id,
        email: user.email
      },
      allProfiles: profiles
    });
  } catch (error) {
    console.error('Error in users route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
