import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { LoginForm, RegisterForm } from '../appTypes'
import sharedStyles from '../components/Shared.module.css'
import formStyles from '../components/FormLayouts.module.css'
import styles from './AuthPage.module.css'

type AuthPageProps = {
  mode: 'login' | 'register'
  loginForm: LoginForm
  registerForm: RegisterForm
  onLoginFormChange: Dispatch<SetStateAction<LoginForm>>
  onRegisterFormChange: Dispatch<SetStateAction<RegisterForm>>
  onLogin: (event: FormEvent<HTMLFormElement>) => void
  onRegister: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthPage({
  mode,
  loginForm,
  registerForm,
  onLoginFormChange,
  onRegisterFormChange,
  onLogin,
  onRegister,
}: AuthPageProps) {
  const isLogin = mode === 'login'

  return (
    <main className={styles.centerPage}>
      <section className={`${sharedStyles.panel} ${styles.authCard}`}>
        <h2>{isLogin ? 'Bejelentkezes' : 'Regisztracio'}</h2>
        <form
          className={formStyles.formStack}
          onSubmit={isLogin ? onLogin : onRegister}
        >
          {!isLogin ? (
            <label className={sharedStyles.field}>
              <span>Nev</span>
              <input
                required
                value={registerForm.name}
                onChange={(event) =>
                  onRegisterFormChange((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
          ) : null}
          <label className={sharedStyles.field}>
            <span>Email</span>
            <input
              required
              type="email"
              value={isLogin ? loginForm.email : registerForm.email}
              onChange={(event) =>
                isLogin
                  ? onLoginFormChange((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  : onRegisterFormChange((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
              }
            />
          </label>
          <label className={sharedStyles.field}>
            <span>Jelszo</span>
            <input
              required
              type="password"
              minLength={isLogin ? 1 : 6}
              value={isLogin ? loginForm.password : registerForm.password}
              onChange={(event) =>
                isLogin
                  ? onLoginFormChange((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  : onRegisterFormChange((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
              }
            />
          </label>
          <button
            type="submit"
            className={`${sharedStyles.button} ${sharedStyles.buttonPrimary} ${sharedStyles.buttonWide}`}
          >
            {isLogin ? 'Belepes' : 'Fiok letrehozasa'}
          </button>
        </form>
      </section>
    </main>
  )
}
