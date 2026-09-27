import { cx } from './styles'

const BACKGROUNDS = ['eef2ff', 'f0fdf4', 'fffbeb', 'fff1f2', 'eff6ff', 'faf5ff']

function hashSeed(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

export function avatarUrl(seed: string) {
  const background = BACKGROUNDS[hashSeed(seed) % BACKGROUNDS.length]
  return `https://api.dicebear.com/10.x/voxel-art/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${background}`
}

interface AvatarProps {
  seed: string
  className?: string
}

export function Avatar({ seed, className }: AvatarProps) {
  return (
    <span className={cx('grid shrink-0 place-items-center overflow-hidden rounded-full bg-gray-100', className)}>
      <img src={avatarUrl(seed)} alt="" loading="lazy" className="h-full w-full object-cover" />
    </span>
  )
}
