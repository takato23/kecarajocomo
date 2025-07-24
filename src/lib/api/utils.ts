import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import type { Database } from '@/lib/supabase/types';

export type ApiResponse<T = any> = {
  data?: T;
  error?: string;
  status: number;
};

export async function withAuth<T>(
  handler: (session: any, supabase: any) => Promise<ApiResponse<T>>
): Promise<NextResponse> {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get auth session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await handler(session, supabase);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export function parseSearchParams(searchParams: URLSearchParams) {
  return {
    page: parseInt(searchParams.get('page') || '0'),
    pageSize: parseInt(searchParams.get('pageSize') || '20'),
    search: searchParams.get('search'),
    sort: searchParams.get('sort') || 'created_at',
    order: (searchParams.get('order') || 'desc') as 'asc' | 'desc',
  };
}

export function validateRequiredFields(
  data: any,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

export function paginateQuery(
  query: any,
  page: number,
  pageSize: number
) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to);
}