import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend/client';
import { InvitationEmail } from '@/lib/resend/templates/invitation-email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, name, role = 'member' } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists in team_members
    const { data: existingTeamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingTeamMember) {
      return NextResponse.json(
        { error: 'This person is already a team member' },
        { status: 400 }
      );
    }

    // Check if user already exists in auth.users
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Check if invitation exists
    const { data: existingInv } = await supabase
      .from('user_invitations')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    let invitation;
    let invitationError;

    if (existingInv) {
      // Update existing invitation with new token and expiration
      console.log('🔄 Updating existing invitation for', email.toLowerCase());
      const { data, error } = await supabase
        .from('user_invitations')
        .update({
          name,
          role,
          token,
          expires_at: expiresAt.toISOString(),
          accepted: false,
          invited_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase())
        .select()
        .single();

      invitation = data;
      invitationError = error;
    } else {
      // Create new invitation
      console.log('📧 Creating new invitation for', email.toLowerCase());
      const { data, error } = await supabase
        .from('user_invitations')
        .insert({
          email: email.toLowerCase(),
          name,
          role,
          token,
          expires_at: expiresAt.toISOString(),
          invited_by: user.id,
        })
        .select()
        .single();

      invitation = data;
      invitationError = error;
    }

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Get inviter's name for email
    const { data: inviterData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const inviterName = inviterData?.name || user.email || 'A team member';

    // Create setup URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const setupUrl = `${baseUrl}/auth/setup-password/${token}`;

    // Send invitation email via Resend
    try {
      const emailHtml = InvitationEmail({
        name,
        inviterName,
        setupUrl,
      });

      // Use verified domain from env, or Resend's default for testing
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      console.log('🚀 Attempting to send email via Resend...');
      console.log('From:', fromEmail);
      console.log('To:', email);
      console.log('Subject:', `You've been invited to join ${inviterName}'s team on Dev Tracker`);

      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: [email],
        subject: `You've been invited to join ${inviterName}'s team on Dev Tracker`,
        html: emailHtml,
      });

      console.log('✅ Resend API Response:', JSON.stringify(emailResponse, null, 2));

      // Check if Resend returned an error in the response
      if (emailResponse.error) {
        console.error('❌ Resend API Error:', emailResponse.error);
        throw new Error(`Resend API error: ${JSON.stringify(emailResponse.error)}`);
      }

      if (!emailResponse.data) {
        console.error('❌ No data in Resend response:', emailResponse);
        throw new Error('No data returned from Resend API');
      }

      console.log('📧 Email sent successfully! ID:', emailResponse.data.id);

      return NextResponse.json({
        success: true,
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
          expiresAt: invitation.expires_at,
        },
        emailId: emailResponse.data.id, // Include Resend email ID for debugging
      });
    } catch (emailError) {
      const error = emailError as Error & { response?: unknown; stack?: string };
      console.error('❌ Error sending email:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });

      // Delete the invitation if email failed
      await supabase
        .from('user_invitations')
        .delete()
        .eq('id', invitation.id);

      return NextResponse.json(
        {
          error: 'Failed to send invitation email. Please try again.',
          details: error.message || 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in invite route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
