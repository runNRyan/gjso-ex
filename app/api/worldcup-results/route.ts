import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/server';

// 결과 저장 (같은 결과면 재사용 + count 증가)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, championText, personality, guestId } = body;

    if (!category || !championText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (typeof category !== 'string' || category.length > 100) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    if (typeof championText !== 'string' || championText.length > 500) {
      return NextResponse.json({ error: 'Invalid champion text' }, { status: 400 });
    }

    const guestIdStr = typeof guestId === 'string' && guestId.length <= 64 ? guestId : null;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? null;

    const supabase = await createClient();
    const personalityType = personality?.type ?? null;

    // 같은 guest + 같은 결과 조합이 있는지 확인
    let query = supabase
      .from('worldcup_results')
      .select('id, result_count')
      .eq('category', category)
      .eq('champion_text', championText);

    if (personalityType) {
      query = query.eq('personality_type', personalityType);
    } else {
      query = query.is('personality_type', null);
    }

    if (guestIdStr) {
      query = query.eq('guest_id', guestIdStr);
    } else {
      query = query.is('guest_id', null);
    }

    const { data: existing } = await query.limit(1).single();

    if (existing) {
      // 기존 결과 재사용: count 증가
      await supabase
        .from('worldcup_results')
        .update({ result_count: existing.result_count + 1 })
        .eq('id', existing.id);

      return NextResponse.json({ id: existing.id });
    }

    // 새 결과 생성
    const id = nanoid(8);
    const { error } = await supabase.from('worldcup_results').insert({
      id,
      category,
      champion_text: championText,
      personality_type: personalityType,
      personality_emoji: personality?.emoji ?? null,
      personality_subtitle: personality?.subtitle ?? null,
      personality_description: personality?.description ?? null,
      guest_id: guestIdStr,
      ip_address: ip,
      result_count: 1,
    });

    if (error) {
      console.error('worldcup_results insert error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// 결과 조회
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('worldcup_results')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
