/**
 * Utility functions for working with geo coordinates and polygon conversions
 */

/**
 * Converts geo coordinates (latitude, longitude) to normalized 3D coordinates
 * suitable for use in Three.js. This keeps the scale consistent with the existing
 * polygon format [-30, 0, -30], [30, 0, 30] etc.
 * 
 * @param farmPolygon Array of lat/long points
 * @param farmLocation Center point of the farm
 * @param scale Scale factor to normalize the coordinates (default: 60)
 * @returns Array of 3D points [x, y, z] for Three.js
 */
export function convertGeoPolygonTo3D(
    farmPolygon: Array<{latitude: number; longitude: number}>,
    farmLocation: {latitude: number; longitude: number},
    scale: number = 60
  ): Array<[number, number, number]> {
    // If we don't have a valid polygon, return a default square
    if (!farmPolygon || farmPolygon.length < 3) {
      return [
        [-30, 0, -30],
        [-30, 0, 30],
        [30, 0, 30],
        [30, 0, -30]
      ];
    }
    
    // Calculate the max distance from center to normalize
    let maxDistance = 0;
    
    for (const point of farmPolygon) {
      // Calculate distance from center
      const latDiff = point.latitude - farmLocation.latitude;
      const lngDiff = point.longitude - farmLocation.longitude;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
      
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    }
    
    // Prevent division by zero
    if (maxDistance === 0) maxDistance = 0.0001;
    
    // Normalize factor to keep within our scale
    const normalizeFactor = scale / maxDistance;
    
    // Convert each point
    return farmPolygon.map(point => {
      // Calculate normalized differences - note we invert latitude for z-axis
      const x = (point.longitude - farmLocation.longitude) * normalizeFactor;
      const z = -(point.latitude - farmLocation.latitude) * normalizeFactor; 
      
      // y is always 0 for flat terrain
      return [x, 0, z] as [number, number, number];
    });
  }
  
  /**
   * Converts a URL parameters polygon string to the geo polygon format
   * 
   * @param polygonString The URL-encoded polygon string
   * @returns Array of latitude/longitude points
   */
  export function parsePolygonFromUrl(polygonString: string | null): Array<{latitude: number; longitude: number}> {
    if (!polygonString) return [];
    
    try {
      return JSON.parse(polygonString);
    } catch (e) {
      console.error('Failed to parse polygon from URL', e);
      return [];
    }
  }