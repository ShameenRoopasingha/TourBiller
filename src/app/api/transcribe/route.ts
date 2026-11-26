import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkDistributedRateLimit } from '@/lib/rate-limit';
import { isAdminOrOwnerRole } from '@/lib/security';

const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; companyId?: string; role?: string } | undefined;

    if (!user?.id || !user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminOrOwnerRole(user.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { limited } = await checkDistributedRateLimit(`transcribe:${user.companyId}:${user.id}`, 20, 60 * 1000);
    if (limited) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again shortly.' }, { status: 429 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile || typeof audioFile.size !== 'number' || audioFile.size === 0) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio file exceeds 5 MB limit' }, { status: 413 });
    }

    if (audioFile.type && !audioFile.type.startsWith('audio/') && audioFile.type !== 'video/webm') {
      return NextResponse.json({ error: 'Invalid audio file type' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Transcription service unavailable' }, { status: 503 });
    }

    const groqFormData = new FormData();
    groqFormData.append('file', audioFile, 'audio.webm');
    // Using the fastest, most capable whisper model on Groq
    groqFormData.append('model', 'whisper-large-v3');
    // Optional: force Sinhala for better accuracy
    // groqFormData.append('language', 'si');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: groqFormData
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq Whisper Error:", err);
      return NextResponse.json({ error: 'Transcription failed' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error('Transcription route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
