export type LoginConfirmationPresenter = () => void

interface PendingConfirmation {
  promise: Promise<boolean>
  resolve: (confirmed: boolean) => void
}

export function createLoginConfirmationController() {
  let presenter: LoginConfirmationPresenter | null = null
  let pending: PendingConfirmation | null = null

  const presentPendingConfirmation = () => {
    if (pending) presenter?.()
  }

  return {
    register(nextPresenter: LoginConfirmationPresenter) {
      presenter = nextPresenter
      presentPendingConfirmation()

      return () => {
        if (presenter === nextPresenter) presenter = null
      }
    },

    request() {
      if (pending) {
        presentPendingConfirmation()
        return pending.promise
      }

      let resolvePending!: (confirmed: boolean) => void
      const promise = new Promise<boolean>(resolve => {
        resolvePending = resolve
      })
      pending = { promise, resolve: resolvePending }
      presentPendingConfirmation()
      return promise
    },

    resolve(confirmed: boolean) {
      const current = pending
      pending = null
      current?.resolve(confirmed)
    },
  }
}
