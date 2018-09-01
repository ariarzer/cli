const execa = require('execa')

export async function installDependencies(cwd: string, packages: Array<string>, mode: string = 'save'): Promise<void> {
  packages = Array.isArray(packages) ? packages : [packages]

  try {
    await execa('npm', ['i', '--package-lock', `--${mode}`].concat(packages), {cwd})
  } catch (error) {
    if (error.code === 'ENOENT') {
      const pluralS = packages.length > 1 ? 's' : ''

      throw new Error(
        `Could not execute npm. Please install the following package${pluralS} with a package manager of your choice: ${packages.join(', ')}`
      )
    } else {
      throw error
    }
  }
}
