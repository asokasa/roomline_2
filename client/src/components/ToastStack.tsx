import type { Toast } from '../appTypes'
import styles from './ToastStack.module.css'

type ToastStackProps = {
  toasts: Toast[]
}

export function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div className={styles.toastStack} aria-live="polite" aria-label="Uzenetek">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.kind]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
