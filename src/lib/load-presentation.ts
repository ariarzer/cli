import * as fs from 'fs'
import {resolve} from 'path'

interface ProjectConfig {
  path: string,
}

export interface AppConfig {
  root: string,
  project: ProjectConfig | null
}

function findExistProject(path: string): ProjectConfig | null {
  const searchLimit = process.env.HOME || '/'

  while (path !== searchLimit) {
    if (fs.existsSync(resolve(path, 'index.html'))) {
      return {
        path
      }
    }

    path = resolve(path, '..')
  }

  return null
}

export function loadAppConfig(root: string = process.cwd()): AppConfig {
  const project: ProjectConfig | null = findExistProject(root)

  return {
    root,
    project,
  }
}
