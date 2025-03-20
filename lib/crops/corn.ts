import * as THREE from 'three';

const createCornPlant = (plantHeight) => {
  const plantGroup = new THREE.Group();
  
  // Corn stalk
  const stalkGeometry = new THREE.CylinderGeometry(0.05, 0.08, plantHeight, 8);
  const stalkMaterial = new THREE.MeshStandardMaterial({ color: 0x7D6E2A });
  const stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
  stalk.position.y = plantHeight / 2;
  stalk.castShadow = true;
  plantGroup.add(stalk);
  
  // Corn leaves
  for (let i = 0; i < 6; i++) {
    const leafHeight = plantHeight * 0.7;
    const leafGeometry = new THREE.PlaneGeometry(0.3, leafHeight);
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x4CAF50,
      side: THREE.DoubleSide
    });
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.position.y = (Math.random() * 0.5 + 0.2) * plantHeight;
    leaf.rotation.y = Math.PI / 2 * i;
    leaf.rotation.x = Math.PI / 6;
    leaf.castShadow = true;
    plantGroup.add(leaf);
  }
  
  // Corn cob
  const cobGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 8);
  const cobMaterial = new THREE.MeshStandardMaterial({ color: 0xFFF176 });
  const cob = new THREE.Mesh(cobGeometry, cobMaterial);
  cob.position.y = plantHeight * 0.6;
  cob.position.x = 0.15;
  cob.rotation.z = Math.PI / 2;
  cob.castShadow = true;
  plantGroup.add(cob);
  
  // Optional second cob on larger plants
  if (plantHeight > 2.2) {
    const secondCob = new THREE.Mesh(cobGeometry, cobMaterial);
    secondCob.position.y = plantHeight * 0.45;
    secondCob.position.x = -0.15;
    secondCob.rotation.z = Math.PI / 2;
    secondCob.castShadow = true;
    plantGroup.add(secondCob);
  }
  
  return plantGroup;
};

export default createCornPlant;