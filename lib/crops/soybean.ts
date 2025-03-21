import * as THREE from 'three';

const createSoybeanPlant = (plantHeight : any) => {
  const plantGroup = new THREE.Group();
  
  // Soybean stem
  const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, plantHeight, 6);
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x8D6E63 });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = plantHeight / 2;
  stem.castShadow = true;
  plantGroup.add(stem);
  
  // Soybean leaves
  for (let i = 0; i < 4; i++) {
    const leafGeometry = new THREE.CircleGeometry(0.1, 8);
    const leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x2E7D32,
      side: THREE.DoubleSide
    });
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.position.y = (i / 4) * plantHeight + 0.1;
    leaf.position.x = 0.1;
    leaf.position.z = 0.05 * (i % 2 === 0 ? 1 : -1);
    leaf.rotation.y = Math.PI / 4;
    leaf.castShadow = true;
    plantGroup.add(leaf);
  }
  
  // Soybean pods
  for (let i = 0; i < 3; i++) {
    const podGeometry = new THREE.CapsuleGeometry(0.02, 0.08, 4, 8);
    const podMaterial = new THREE.MeshStandardMaterial({ color: 0x9CCC65 });
    const pod = new THREE.Mesh(podGeometry, podMaterial);
    pod.position.y = plantHeight * 0.7 - (i * 0.1);
    pod.position.x = 0.08;
    pod.position.z = 0.05 * (i % 2 === 0 ? 1 : -1);
    pod.rotation.z = Math.PI / 3;
    pod.castShadow = true;
    plantGroup.add(pod);
  }
  
  return plantGroup;
};

export default createSoybeanPlant;