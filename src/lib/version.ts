/** What's running: the released version, the exact commit, and when it was built. */
export const APP_VERSION = __APP_VERSION__
export const GIT_SHA = __GIT_SHA__
export const BUILD_TIME = __BUILD_TIME__

export const buildDate = () =>
  new Date(BUILD_TIME).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

/** The release on GitHub that matches this build. */
export const releaseUrl = `https://github.com/Steve-Plancher/sdsb/releases/tag/v${APP_VERSION}`
