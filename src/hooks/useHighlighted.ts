import { useEffect, useMemo } from "react";
import * as THREE from "three";

type Options = {
  color?: string | THREE.Color;
  opacity?: number;
  scale?: number;
};

export default function useHighlighted(
  model: THREE.Object3D | null | undefined,
  highlighted: boolean,
  opts?: Options,
) {
  const { color = "#ff9800", opacity = 0.1, scale = 1 } = opts || {};

  const highlightMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
  }, [color, opacity]);

  useEffect(() => {
    if (!model) return;
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.visible === false) return;
        const glowName = `${child.name || child.uuid}_glow`;
        if (!child.getObjectByName(glowName)) {
          const glow = new THREE.Mesh(child.geometry, highlightMaterial);
          glow.name = glowName;
          glow.renderOrder = 999;
          glow.visible = false;
          glow.scale.set(scale, scale, scale);
          child.add(glow);
        }
      }
    });
  }, [model, highlightMaterial, scale]);

  useEffect(() => {
    if (!model) return;
    model.traverse((mesh) => {
      const glowName = `${mesh.name || mesh.uuid}_glow`;
      const glow = mesh.getObjectByName(glowName) as THREE.Mesh | undefined;
      if (!glow) return;
      glow.visible = Boolean(highlighted);
    });
  }, [model, highlighted]);
}
