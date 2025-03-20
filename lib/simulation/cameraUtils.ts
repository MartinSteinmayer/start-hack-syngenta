/**
 * Adjusts camera to view the entire field
 * @param {Array} scaledPolygon - Scaled polygon vertices defining the field
 * @param {THREE.PerspectiveCamera} camera - The THREE.js camera
 * @param {OrbitControls} controls - The OrbitControls instance
 */
export const adjustCameraView = (scaledPolygon, camera, controls) => {
    if (!camera || !controls) return;
    
    // Find bounding box
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    
    scaledPolygon.forEach(point => {
      minX = Math.min(minX, point[0]);
      maxX = Math.max(maxX, point[0]);
      minZ = Math.min(minZ, point[2]);
      maxZ = Math.max(maxZ, point[2]);
    });
    
    // Calculate center and size
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const size = Math.max(width, depth);
    
    // Position camera to see the entire field, adjusted for the sidebar
    camera.position.set(centerX + 20, size * 1.2, centerZ + size * 1.5);
    controls.target.set(centerX, 0, centerZ);
    controls.update();
  };