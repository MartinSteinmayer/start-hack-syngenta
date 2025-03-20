import * as THREE from 'three';
import { HECTARE_TO_SQUARE_METERS, SCALE_FACTOR } from '../crops';

/**
 * Calculate the area of a polygon in square units
 * @param {Array} vertices - Array of vertices defining the polygon
 * @returns {number} - Area of the polygon
 */
export const calculatePolygonArea = (vertices) => {
  let area = 0;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    area += (vertices[i][0] * vertices[j][2]) - (vertices[j][0] * vertices[i][2]);
  }
  return Math.abs(area) / 2;
};

/**
 * Scale polygon to match the specified hectare size
 * @param {Array} polygon - Array of vertices defining the polygon
 * @param {number} hectares - Target size in hectares
 * @returns {Array} - Scaled polygon vertices
 */
export const scalePolygonToHectares = (polygon, hectares) => {
  const targetArea = hectares * HECTARE_TO_SQUARE_METERS * SCALE_FACTOR * SCALE_FACTOR;
  const currentArea = calculatePolygonArea(polygon);
  const scaleFactor = Math.sqrt(targetArea / currentArea);
  
  // Calculate centroid
  let centroidX = 0, centroidZ = 0;
  polygon.forEach(point => {
    centroidX += point[0];
    centroidZ += point[2];
  });
  centroidX /= polygon.length;
  centroidZ /= polygon.length;
  
  // Scale points relative to centroid - ensure field stays within boundaries
  const maxDimension = 150; // Maximum size for any dimension to prevent going outside view
  
  const scaled = polygon.map(point => [
    centroidX + (point[0] - centroidX) * scaleFactor,
    0, // y-coordinate stays at 0
    centroidZ + (point[2] - centroidZ) * scaleFactor
  ]);
  
  // Check if any dimension exceeds our max limits
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  
  scaled.forEach(point => {
    minX = Math.min(minX, point[0]);
    maxX = Math.max(maxX, point[0]);
    minZ = Math.min(minZ, point[2]);
    maxZ = Math.max(maxZ, point[2]);
  });
  
  const width = maxX - minX;
  const depth = maxZ - minZ;
  
  // If either dimension is too large, apply additional scaling
  if (width > maxDimension || depth > maxDimension) {
    const additionalScaleFactor = Math.min(maxDimension / width, maxDimension / depth);
    
    return scaled.map(point => [
      centroidX + (point[0] - centroidX) * additionalScaleFactor,
      0,
      centroidZ + (point[2] - centroidZ) * additionalScaleFactor
    ]);
  }
  
  // Ensure minimum field size for visibility - no fields smaller than 40x40
  const minDimension = 40;
  if (width < minDimension || depth < minDimension) {
    const minScaleFactor = Math.max(minDimension / width, minDimension / depth);
    
    return scaled.map(point => [
      centroidX + (point[0] - centroidX) * minScaleFactor,
      0,
      centroidZ + (point[2] - centroidZ) * minScaleFactor
    ]);
  }
  
  return scaled;
};

/**
 * Triangulate a polygon for plant placement
 * @param {Array} polygon - Array of vertices defining the polygon
 * @returns {Array} - Array of triangles (each triangle is an array of 3 vertices)
 */
export const triangulatePolygon = (polygon) => {
  const triangles = [];
  // Simple ear-clipping triangulation (for convex polygons)
  for (let i = 1; i < polygon.length - 1; i++) {
    triangles.push([
      polygon[0],
      polygon[i],
      polygon[i + 1]
    ]);
  }
  return triangles;
};

/**
 * Generate a random point within a triangle using barycentric coordinates
 * @param {Array} triangle - Array of 3 vertices defining the triangle
 * @returns {Object} - Random point {x, z} within the triangle
 */
export const getRandomPointInTriangle = (triangle) => {
  // Create barycentric coordinates
  let a = Math.random();
  let b = Math.random();
  
  // Ensure the point is within the triangle
  if (a + b > 1) {
    a = 1 - a;
    b = 1 - b;
  }
  
  const c = 1 - a - b;
  
  // Calculate the position
  const x = a * triangle[0][0] + b * triangle[1][0] + c * triangle[2][0];
  const z = a * triangle[0][2] + b * triangle[1][2] + c * triangle[2][2];
  
  return { x, z };
};

/**
 * Creates a field information sign at the centroid of the field
 * @param {THREE.Scene} scene - The THREE.js scene
 * @param {Object} simulation - Simulation parameters
 * @param {Array} scaledPolygon - Scaled polygon vertices
 * @returns {Array} - Array of created objects
 */
export const createFieldInfoSign = (scene, simulation, scaledPolygon) => {
  const createdObjects = [];
  const { type, hectares, density } = simulation;
  
  // Calculate centroid of the field for sign placement
  let centroidX = 0, centroidZ = 0;
  scaledPolygon.forEach(point => {
    centroidX += point[0];
    centroidZ += point[2];
  });
  centroidX /= scaledPolygon.length;
  centroidZ /= scaledPolygon.length;
  
  // Create sign post
  const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const post = new THREE.Mesh(postGeometry, postMaterial);
  post.position.set(centroidX, 1, centroidZ);
  post.castShadow = true;
  scene.add(post);
  createdObjects.push(post);
  
  // Create sign
  const signGeometry = new THREE.PlaneGeometry(2, 1);
  
  // Create canvas for sign text
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 256, 128);
  
  // Add border
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, 246, 118);
  
  // Add text
  ctx.fillStyle = 'black';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Crop Simulation`, 128, 30);
  
  ctx.font = '16px Arial';
  ctx.fillText(`Crop: ${type.charAt(0).toUpperCase() + type.slice(1)}`, 128, 55);
  ctx.fillText(`Area: ${hectares.toFixed(1)} hectares`, 128, 80);
  ctx.fillText(`Density: ${density}%`, 128, 105);
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  const signMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide
  });
  
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(centroidX, 2, centroidZ);
  sign.castShadow = true;
  scene.add(sign);
  createdObjects.push(sign);
  
  return createdObjects;
};