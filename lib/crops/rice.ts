import * as THREE from 'three';

const createRicePlant = (plantHeight) => {
  const plantGroup = new THREE.Group();
  
  // Rice stem
  const riceStemGeometry = new THREE.CylinderGeometry(0.01, 0.015, plantHeight, 6);
  const riceStemMaterial = new THREE.MeshStandardMaterial({ color: 0x9CCC65 });
  const riceStem = new THREE.Mesh(riceStemGeometry, riceStemMaterial);
  riceStem.position.y = plantHeight / 2;
  riceStem.castShadow = true;
  plantGroup.add(riceStem);
  
  // Rice grains
  const grainGeometry = new THREE.ConeGeometry(0.04, 0.2, 6);
  const grainMaterial = new THREE.MeshStandardMaterial({ color: 0xF0E68C });
  const grain = new THREE.Mesh(grainGeometry, grainMaterial);
  grain.position.y = plantHeight + 0.05;
  grain.rotation.x = Math.PI;
  grain.castShadow = true;
  plantGroup.add(grain);
  
  // Rice leaves
  for (let i = 0; i < 3; i++) {
    const leafGeometry = new THREE.PlaneGeometry(0.02, 0.3);
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x81C784,
      side: THREE.DoubleSide
    });
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.position.y = plantHeight * 0.5 + (i * 0.1);
    leaf.position.x = 0.03 * (i % 2 === 0 ? 1 : -1);
    leaf.rotation.x = Math.PI / 6;
    leaf.rotation.z = Math.PI / 6 * (i % 2 === 0 ? 1 : -1);
    leaf.castShadow = true;
    plantGroup.add(leaf);
  }
  
  return plantGroup;
};

export default createRicePlant;