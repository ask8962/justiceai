import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware — Adds CORS headers to all /api/* routes.
 * This allows the standalone test client to call the API from a different origin.
 */
export function middleware(request: NextRequest) {
    // Only apply CORS to API routes
    if (!request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // Handle preflight OPTIONS
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-user-email',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // For actual requests, add CORS headers to the response
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-email');

    return response;
}

export const config = {
    matcher: '/api/:path*',
};
