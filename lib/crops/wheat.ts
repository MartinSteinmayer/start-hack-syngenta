import * as THREE from 'three';

const createWheatPlant = (plantHeight) => {
  const plantGroup = new THREE.Group();
  
  // Wheat stalk
  const wheatStalkGeometry = new THREE.CylinderGeometry(0.01, 0.02, plantHeight, 6);
  const wheatStalkMaterial = new THREE.MeshStandardMaterial({ color: 0xCDDC39 });
  const wheatStalk = new THREE.Mesh(wheatStalkGeometry, wheatStalkMaterial);
  wheatStalk.position.y = plantHeight / 2;
  wheatStalk.castShadow = true;
  plantGroup.add(wheatStalk);
  
  // Wheat head
  const wheatHeadGeometry = new THREE.CylinderGeometry(0.03, 0.01, 0.2, 6);
  const wheatHeadMaterial = new THREE.MeshStandardMaterial({ color: 0xFDD835 });
  const wheatHead = new THREE.Mesh(wheatHeadGeometry, wheatHeadMaterial);
  wheatHead.position.y = plantHeight + 0.1;
  wheatHead.castShadow = true;
  plantGroup.add(wheatHead);
  
  return plantGroup;
};

export default createWheatPlant;