import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  translateX: number
  translateY: number
  size: number
  alpha: number
  targetAlpha: number
  velocityX: number
  velocityY: number
  magnetism: number
}

type UseParticlesCanvasProps = {
  quantity: number
  color: string
  staticity: number
  ease: number
}

function getRandomParticle(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    translateX: 0,
    translateY: 0,
    size: Math.random() * 1.5 + 0.7,
    alpha: 0,
    targetAlpha: Math.random() * 0.45 + 0.22,
    velocityX: (Math.random() - 0.5) * 0.28,
    velocityY: (Math.random() - 0.5) * 0.28,
    magnetism: Math.random() * 0.7 + 0.35,
  }
}

function drawParticle(
  context: CanvasRenderingContext2D,
  particle: Particle,
  color: string,
) {
  context.save()
  context.globalAlpha = particle.alpha
  context.fillStyle = color
  context.shadowBlur = 8
  context.shadowColor = color
  context.beginPath()
  context.arc(
    particle.x + particle.translateX,
    particle.y + particle.translateY,
    particle.size,
    0,
    Math.PI * 2,
  )
  context.fill()
  context.restore()
}

export function useParticlesCanvas({
  quantity,
  color,
  staticity,
  ease,
}: UseParticlesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const roomElement = canvas?.parentElement

    if (!canvas || !roomElement) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    let width = 0
    let height = 0
    let animationFrame = 0

    const createParticles = () => {
      particlesRef.current = Array.from({ length: quantity }, () =>
        getRandomParticle(width, height),
      )
    }

    const resizeCanvas = () => {
      const pixelRatio = window.devicePixelRatio || 1
      const rect = roomElement.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * pixelRatio
      canvas.height = height * pixelRatio
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      createParticles()
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = roomElement.getBoundingClientRect()
      mouseRef.current = {
        x: event.clientX - rect.left - width / 2,
        y: event.clientY - rect.top - height / 2,
      }
    }

    const handlePointerLeave = () => {
      mouseRef.current = { x: 0, y: 0 }
    }

    const animate = () => {
      context.clearRect(0, 0, width, height)

      particlesRef.current.forEach((particle, index) => {
        particle.x += particle.velocityX
        particle.y += particle.velocityY
        particle.alpha += (particle.targetAlpha - particle.alpha) * 0.04

        const magnetX =
          (-mouseRef.current.x / staticity) * particle.magnetism
        const magnetY =
          (-mouseRef.current.y / staticity) * particle.magnetism

        particle.translateX += (magnetX - particle.translateX) / ease
        particle.translateY += (magnetY - particle.translateY) / ease

        if (
          particle.x < -20 ||
          particle.x > width + 20 ||
          particle.y < -20 ||
          particle.y > height + 20
        ) {
          particlesRef.current[index] = getRandomParticle(width, height)
        }

        drawParticle(context, particle, color)
      })

      animationFrame = requestAnimationFrame(animate)
    }

    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(roomElement)
    roomElement.addEventListener('pointermove', handlePointerMove)
    roomElement.addEventListener('pointerleave', handlePointerLeave)
    resizeCanvas()
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
      roomElement.removeEventListener('pointermove', handlePointerMove)
      roomElement.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [color, ease, quantity, staticity])

  return canvasRef
}
