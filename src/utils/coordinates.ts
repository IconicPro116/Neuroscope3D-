import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatVolume(ml: number): string {
  return `${ml.toFixed(2)} mL`;
}

// Transform voxel coordinate (i, j, k) to world physical coordinate (x, y, z) in mm using 4x4 affine matrix
export function voxelToWorld(
  voxel: [number, number, number],
  affine: number[][]
): [number, number, number] {
  const [i, j, k] = voxel;
  const x = affine[0][0] * i + affine[0][1] * j + affine[0][2] * k + affine[0][3];
  const y = affine[1][0] * i + affine[1][1] * j + affine[1][2] * k + affine[1][3];
  const z = affine[2][0] * i + affine[2][1] * j + affine[2][2] * k + affine[2][3];
  return [parseFloat(x.toFixed(2)), parseFloat(y.toFixed(2)), parseFloat(z.toFixed(2))];
}

// Invert 4x4 affine matrix (for standard orthogonal affine with translation) to convert world coordinates to voxel indices
export function worldToVoxel(
  world: [number, number, number],
  affine: number[][]
): [number, number, number] {
  // Simplified matrix inversion for affine with orthogonal axes
  const [x, y, z] = world;
  const dx = x - affine[0][3];
  const dy = y - affine[1][3];
  const dz = z - affine[2][3];

  const sx = affine[0][0] || 1;
  const sy = affine[1][1] || 1;
  const sz = affine[2][2] || 1;

  const i = Math.round(dx / sx);
  const j = Math.round(dy / sy);
  const k = Math.round(dz / sz);

  return [i, j, k];
}
