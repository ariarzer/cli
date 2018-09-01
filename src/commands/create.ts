import chalk from 'chalk'
import {promisify} from 'util'
import {exists, mkdir} from 'fs'
import {isAbsolute, join} from 'path'
import {Command, flags} from '@oclif/command'

import * as del from 'del'
import * as Listr from 'listr'
import * as vfs from 'vinyl-fs'
import * as inquirer from 'inquirer'
import * as template from 'gulp-template'

import {installDependencies} from '../lib/npm'
import {AppConfig, loadAppConfig} from '../lib/load-presentation'

export default class Create extends Command {
  static description = 'create a new project'

  static flags = {
    help: flags.help({char: 'h'}),
    force: flags.boolean({char: 'f'}),
  }

  static args = [{
    name: 'directory',
    default: 'slides'
  }]

  async run() {
    const {args, flags} = this.parse(Create)
    const {root}: AppConfig = loadAppConfig()

    const folderName = args.directory
    const directory = isAbsolute(folderName) ? folderName : join(this.config.root, folderName)

    if (await promisify(exists)(directory)) {
      let forse: boolean = flags.force

      if (!forse) {
        const result = await inquirer.prompt<{ forse: boolean }>({
          name: 'forse',
          type: 'confirm',
          default: false,
          message: chalk`The {bold ${folderName}} dir already exists. Do you want to overwrite it?`
        })

        forse = result.forse
      }

      if (forse) {
        await del([directory])
      } else {
        this.log(chalk.red(' Creating aborted'))

        return
      }
    }

    const {theme, ratio} = await inquirer.prompt<{ theme: string, ratio: string }>([{
      name: 'theme',
      type: 'list',
      message: 'Select theme',
      choices: ['ribbon', 'material']
    }, {
      name: 'ratio',
      type: 'list',
      message: 'Select presentation ratio',
      choices: ['16 / 9', '5 / 3']
    }])

    const options = {
      ratio, theme,
      template: 'presentation',
      year: (new Date()).getFullYear(),
    }

    const tasks = new Listr([
      // 1. Create project structure
      {
        title: `Creating is project structure in "${folderName}" dir`,
        async task() {
          await promisify(mkdir)(directory)

          await new Promise((resolve, reject) => {
            const files = ['**', '**/.*']

            vfs.src(files, {
              cwd: join(__dirname, '..', '..', 'templates', options.template)
            })
              .pipe(template(options, {}))
              .pipe(vfs.dest(directory))
              .on('end', resolve)
              .on('error', reject)
          })
        }
      },

      // 2. Install dependencies
      {
        title: 'Installing dependencies',
        task: () => Promise.all([
          installDependencies(directory, ['shower-cli'], 'save-dev'),
          installDependencies(directory, ['shower-core', `shower-${options.theme}`])
        ])
      }
    ])

    await tasks.run()
  }
}
