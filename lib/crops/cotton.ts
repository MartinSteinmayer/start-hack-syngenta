import * as THREE from 'three';

const createCottonPlant = (plantHeight : any) => {
  const plantGroup = new THREE.Group();
  
  // Cotton stem
  const cottonStemGeometry = new THREE.CylinderGeometry(0.02, 0.03, plantHeight, 6);
  const cottonStemMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
  const cottonStem = new THREE.Mesh(cottonStemGeometry, cottonStemMaterial);
  cottonStem.position.y = plantHeight / 2;
  cottonStem.castShadow = true;
  plantGroup.add(cottonStem);
  
  // Cotton leaves
  for (let i = 0; i < 5; i++) {
    const leafGeometry = new THREE.CircleGeometry(0.1, 5);
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x388E3C,
      side: THREE.DoubleSide
    });
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.position.y = (i / 5) * plantHeight;
    leaf.position.x = 0.1 * (i % 2 === 0 ? 1 : -1);
    leaf.rotation.x = Math.PI / 4;
    leaf.rotation.y = (i / 5) * Math.PI;
    leaf.castShadow = true;
    plantGroup.add(leaf);
  }
  
  // Cotton bolls
  for (let i = 0; i < 3; i++) {
    const bollGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const bollMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const boll = new THREE.Mesh(bollGeometry, bollMaterial);
    boll.position.y = plantHeight * 0.6 + (i * 0.15);
    boll.position.x = 0.1 * (i % 2 === 0 ? 1 : -1);
    boll.position.z = 0.05 * (i % 2 === 0 ? 1 : -1);
    boll.castShadow = true;
    plantGroup.add(boll);
  }
  
  return plantGroup;
};

export default createCottonPlant;