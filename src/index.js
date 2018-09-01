const fs = require('fs')
const path = require('path')
const util = require('util')
const chalk = require('chalk')
const Listr = require('listr')

const app = require('yargs')

const { version } = require('../package.json')

const loadConfig = require('./lib/load_config')

/**
 * Apply CLI command
 *
 * @param {ProjectConfig} config
 * @param {Object} command
 * @param {Object} options
 * @return {Promise<void>}
 */
async function applyCommand (config, command, options) {
  let { messages = {}, config: taskConfig = {} } = command

  if (typeof messages === 'function') {
    messages = messages(config, options)
  }

  if (taskConfig.requiredExistingPresentation && !config.project) {
    process.stdout.write(
      chalk`{red Shower presentation not found}\n\n` +
      chalk`Use {yellow shower create} to create a presentation\n` +
      chalk`Run {yellow shower create --help} to learn more\n`
    )

    return
  }

  const s = Date.now()

  if (messages.start) {
    await (new Listr([
      {
        title: messages.start,
        task: () => command(config, options)
      }
    ])).run()
  } else {
    await command(config, options)
  }

  const time = ((Date.now() - s) / 1000).toFixed()

  if (messages.end) {
    process.stdout.write(`\n ${messages.end} 🎉 ${chalk.yellow(`[in ${time}s]`)}\n`)
  }

  process.exitCode = 0
}

module.exports = async function setupCLI () {
  const commandsDir = path.join(__dirname, 'command')
  const commandsList = util.promisify(fs.readdir)(commandsDir)
    .filter(el => /\.js$/i.test(el))

  const commands = commandsList.map(command => require(path.join(commandsDir, command)))

  app
    .locale('en')
    .version(version)
    .usage('Usage: ' + chalk.cyan('$0 [--version] [--help] <command> [<args>]'))

  const config = await loadConfig()

  for (const command of commands) {
    app.command(Object.assign({}, command.setup, {
      describe: chalk`\b- {yellow ${command.setup.describe}}`,
      handler: (options) => applyCommand(config, command, options)
    }))
  }

  // add some useful info on help
  app.epilog(
    `See ` +
    chalk.cyan('$0 <command> --help') +
    ' to read about a specific subcommand.'
  )

  app.strict()

  app.argv // eslint-disable-line no-unused-expressions

  if (!process.argv.slice(2).length) {
    app.showHelp()
  }
}
