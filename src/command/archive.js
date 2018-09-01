const vfs = require('vinyl-fs')
const zip = require('gulp-zip')
const chalk = require('chalk')

const { loadPresentationFiles } = require('../lib/load_presentation_files')

function archive (_, { output, files }) {
  const stream = loadPresentationFiles(files)
    .pipe(zip(output))
    .pipe(vfs.dest('.'))

  return new Promise((resolve, reject) => {
    stream
      .on('end', resolve)
      .on('error', reject)
  })
}

archive.setup = {
  command: 'archive',
  describe: 'Archive the project',
  builder: yargs => yargs.options({
    output: {
      alias: 'o',
      type: 'string',
      default: 'archive.zip',
      describe: 'Archive name'
    },
    files: {
      alias: 'f',
      array: true,
      type: 'string',
      describe: 'List of files that will get the build'
    }
  })
}

archive.config = {
  requiredExistingPresentation: true
}

archive.messages = (_, { output }) => ({
  start: 'The project is being archived',
  end: chalk`Created archive {bold ${output}} with presentation`
})

module.exports = archive
