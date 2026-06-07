import { useParticlesCanvas } from '../hooks/useParticlesCanvas'
import styles from './ParticlesBackground.module.css'

type ParticlesBackgroundProps = {
  quantity?: number
  color?: string
  staticity?: number
  ease?: number
}

export function ParticlesBackground({
  quantity = 90,
  color = '#38f8ff',
  staticity = 55,
  ease = 55,
}: ParticlesBackgroundProps) {
  const canvasRef = useParticlesCanvas({ quantity, color, staticity, ease })

  return <canvas className={styles.particlesCanvas} ref={canvasRef} />
}
