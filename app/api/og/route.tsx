import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

// Google Fonts에서 Noto Sans KR 로드 (가장 안정적)
async function loadFont(): Promise<ArrayBuffer> {
  const googleFontUrl =
    'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&display=swap'

  const css = await (await fetch(googleFontUrl)).text()

  const fontUrl = css.match(
    /src: url\((.+?)\) format\('(opentype|truetype|woff2?)'\)/
  )?.[1]

  if (!fontUrl) {
    throw new Error('Failed to extract font URL from Google Fonts CSS')
  }

  return (await fetch(fontUrl)).arrayBuffer()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const fontData = await loadFont()
    const fontConfig = {
      fonts: [
        {
          name: 'NotoSansKR',
          data: fontData,
          weight: 700 as const,
          style: 'normal' as const,
        },
      ],
    }

    if (id) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: question } = await supabase
        .from('questions')
        .select('title, option_a, option_b')
        .eq('id', id)
        .single()

      if (question) {
        return new ImageResponse(
          (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#2F4D4B',
                color: '#FAFBFB',
                fontFamily: 'NotoSansKR',
                padding: '60px',
              }}
            >
              <div
                style={{
                  fontSize: 30,
                  marginBottom: 40,
                  opacity: 0.9,
                }}
              >
                결정소 질문!
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 60,
                  marginBottom: 50,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: 400,
                  }}
                >
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 700,
                      textAlign: 'center',
                      lineHeight: 1.2,
                      marginBottom: 12,
                    }}
                  >
                    {question.option_a}
                  </div>
                  <div style={{ fontSize: 22, opacity: 0.6 }}>A</div>
                </div>

                <div
                  style={{
                    fontSize: 42,
                    fontWeight: 700,
                    opacity: 0.7,
                  }}
                >
                  VS
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: 400,
                  }}
                >
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 700,
                      textAlign: 'center',
                      lineHeight: 1.2,
                      marginBottom: 12,
                    }}
                  >
                    {question.option_b}
                  </div>
                  <div style={{ fontSize: 22, opacity: 0.6 }}>B</div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 24,
                  opacity: 0.8,
                  marginBottom: 16,
                }}
              >
                당신의 선택은?
              </div>

              <div
                style={{
                  fontSize: 18,
                  opacity: 0.5,
                }}
              >
                결정소 | example.com
              </div>
            </div>
          ),
          { width: 1200, height: 630, ...fontConfig }
        )
      }
    }

    // Default: redirect to static logo PNG
    const baseUrl = new URL(request.url).origin
    return Response.redirect(`${baseUrl}/og-default.png`, 302)
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
