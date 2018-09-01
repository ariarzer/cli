const vfs = require('vinyl-fs')
const chalk = require('chalk')
const path = require('path')
const del = require('del')

const { loadPresentationFiles } = require('../lib/load_presentation_files')

function prepare ({ root }, { output, files }) {
  if (!path.isAbsolute(output)) {
    output = path.join(root, output)
  }

  const stream = loadPresentationFiles(files)
    .pipe(vfs.dest(output))

  del.sync([output])

  return new Promise((resolve, reject) => {
    stream
      .on('end', resolve)
      .on('error', reject)
  })
}

prepare.setup = {
  command: 'prepare',
  describe: 'Prepare the project',
  builder: yargs => yargs.options({
    output: {
      alias: 'o',
      type: 'string',
      default: 'prepared',
      describe: 'In which folder will the prepared presentation be written'
    },
    files: {
      alias: 'f',
      array: true,
      type: 'string',
      describe: 'List of files that will get the build'
    }
  })
}

prepare.config = {
  requiredExistingPresentation: true
}

prepare.messages = (_, { output }) => ({
  start: 'Project preparation in progress',
  end: chalk`Project prepared in {bold ${output}} dir`
})

module.exports = prepare
