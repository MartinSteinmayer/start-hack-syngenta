import { NextRequest, NextResponse } from 'next/server';

/**
 * Satellite image proxy API route
 * This proxies requests to the Python satellite API to avoid CORS issues
 */
export async function POST(request: NextRequest) {
  try {
    // Get parameters from the request body
    const body = await request.json();
    const { latitude, longitude, hectares, start_date, end_date } = body;

    // Validate required parameters
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required parameters: latitude and longitude' },
        { status: 400 }
      );
    }

    // Construct the API endpoint URL with query parameters
    const apiUrl = 'http://localhost:5032/satellite';
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hectares: hectares ? hectares.toString() : '10',
      start_date: start_date || '2023-01-01',
      end_date: end_date || '2025-03-20'
    });

    console.log(`Proxying satellite image request to: ${apiUrl}?${params}`);

    // Make the request to the Python API
    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      // We're in node.js context here, so CORS doesn't apply
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Satellite API error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { error: `Satellite API responded with ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the content type to forward it correctly
    const contentType = response.headers.get('content-type') || 'image/png';
    
    // Get the image data as an array buffer
    const imageBuffer = await response.arrayBuffer();

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error proxying satellite image:', error);
    return NextResponse.json(
      { error: `Failed to fetch satellite image: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}