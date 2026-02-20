import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS Middleware for API v1 routes.
 * Allows cross-origin requests from any origin during development.
 */

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-user-email',
    'Access-Control-Max-Age': '86400',
};

/**
 * Add CORS headers to ANY NextResponse.
 */
export function withCors(response: NextResponse): NextResponse {
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

/**
 * Handle OPTIONS preflight requests.
 */
export function handleCorsPreFlight(): NextResponse {
    return new NextResponse(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
}
