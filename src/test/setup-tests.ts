/**
 * Vitest 测试环境配置
 * 配置 @testing-library/jest-dom 和其他测试工具
 *
 * @author Bamzc
 */

import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import * as THREE from "three";
import { afterEach, vi } from "vitest";

// Mock HTMLCanvasElement for Three.js
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: "",
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({ data: [] })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  ellipse: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  clearRect: vi.fn(),
  stroke: vi.fn(),
  strokeText: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  getLineDash: vi.fn(() => []),
  setLineDash: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createPattern: vi.fn(),
})) as any;

// Mock THREE.Group.clone() 方法
THREE.Group.prototype.clone = vi.fn(function (this: THREE.Group) {
  const clone = new THREE.Group();
  clone.uuid = this.uuid;
  clone.name = this.name;
  clone.position.copy(this.position);
  clone.rotation.copy(this.rotation);
  clone.scale.copy(this.scale);
  return clone;
});

// 每个测试后清理
afterEach(() => {
  cleanup();
});
