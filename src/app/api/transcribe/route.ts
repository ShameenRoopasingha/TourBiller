import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
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
      body: groqFormData as any
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
