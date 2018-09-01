const fs = require('fs')
const del = require('del')
const path = require('path')
const chalk = require('chalk')
const Listr = require('listr')
const vfs = require('vinyl-fs')
const inquirer = require('inquirer')
const { promisify } = require('util')
const template = require('gulp-template')

const { isExist } = require('../lib/files')
const { installDependencies } = require('../lib/npm')

async function create ({ root }, { directory: folderName = 'slides' }) {
  // Let's check if such folder exists
  const directory = path.isAbsolute(folderName) ? folderName : path.join(root, folderName)

  if (isExist(directory)) {
    const { isForce } = await inquirer.prompt({
      name: 'isForce',
      type: 'confirm',
      default: false,
      message: `The ${chalk.yellow(folderName)} dir already exists. Do you want to overwrite it?`
    })

    if (isForce) {
      await del([directory])
    } else {
      process.stdout.write(chalk.red(`\n Creating aborted\n`))

      return
    }
  }

  const options = {
    template: 'presentation',
    year: (new Date()).getFullYear()
  }

  const params = [{
    name: 'theme',
    type: 'list',
    message: 'Select theme',
    choices: ['ribbon', 'material']
  }, {
    name: 'ratio',
    type: 'list',
    message: 'Select presentation ratio',
    choices: ['16 / 9', '5 / 3']
  }]

  Object.assign(options, await inquirer.prompt(params))

  process.stdout.write('\n')

  const tasks = new Listr([
    // 1. Create project structure
    {
      title: `Creating is project structure in "${folderName}" dir`,
      async task () {
        await promisify(fs.mkdir)(directory)

        await new Promise((resolve, reject) => {
          const files = ['**', '**/.*']

          vfs.src(files, {
            cwd: path.join(__dirname, '..', '..', 'templates', options.template)
          })
            .pipe(template(options))
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

create.setup = {
  command: 'create [<directory>]',
  describe: 'Create a new project',
  builder: yargs => yargs
    .positional('directory', {})
}

create.config = {
  requiredExistingPresentation: false
}

create.messages = (_, { directory: folderName = 'slides' }) => ({
  end: `Project created in ${chalk.bold(folderName)} dir`
})

module.exports = create