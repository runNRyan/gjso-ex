import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = '불호 월드컵 | 결정소';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  const imageData = await readFile(
    join(process.cwd(), 'public/worldcup/images/ddabongso.png')
  );
  const base64 = `data:image/png;base64,${imageData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={base64} alt="" width={550} height={550} />
      </div>
    ),
    { ...size }
  );
}
