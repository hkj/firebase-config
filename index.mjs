#!/usr/bin/env node

import * as fs from 'fs'
import yargs from 'yargs'
import inquirer from 'inquirer'
import * as readline from 'readline'
import json5 from 'json5'
import path from 'path'

/*
I use Firebase with Vue and handle firebaseConfig as an environment variable by reading it
from an external file. After doing this many times, I decided to reduce the hassle.
*/

// The assumption is that the default is Vue, otherwise React

// 'REACT_APP_' for React
let prefix = 'VUE_APP_'
// File to which environment variables are written
let envFile = '.env.local'
// TypeScript or not.
// If finally true, the language variable becomes TypeScript
let typescript = false
let language = 'JavaScript'
let framework = 'vue'
// Name of the Firebase configuration file, which reads the file containing the environment variables
let fbname = 'firebase.js'

// key: environment variable name, value: firebase config
let firebaseEnvConfig = {}

// key: firebase config key, value: Read environment variable name using proces.env
let firebaseConfig = {}

/**
 * Returns true if filePath exists, false if not.
 * @param {string} filePath
 */
const fileCheck = (filePath) => {
  let isExist = false
  try {
    fs.statSync(filePath)
    isExist = true
  } catch(err) {
    isExist = false
  }
  return isExist
}
/**
 * Used in validate inside prompt.
 * Returns false if there is a forbidden character in filename, true otherwise.
 * @param {string} fileName
 */
const fileNameCheck = (fileName) => {
  if (fileName.match( /^.*[(\\|/|:|\*|?|\"|<|>|\|)].*$/ )) {
    return false
  }
  return true
}

(async () => {

  const usage =
`Usage: $0

Tools for Vue or React.Separate In answer to the question,
Firebase configuration into environment variable files and firebase.js, etc.
`
  const argv = yargs(process.argv.slice(2))
  .usage(usage).wrap(null)
  .help().alias('h', 'help')
  .version().alias('v', 'version')
  .argv

  let res = await inquirer.prompt([
  {
    type: 'input',
    name: 'source',
    message: 'Where is the root dir of the your App?',
    default: './',
  },
  {
    type: 'input',
    name: 'output',
    default: '.env.local',
    message: 'Enviroment Variables file name?',
    validate: (fileName) => {
      if (fileNameCheck(fileName)) {
        return true
      } else {
        return `don't use forbidden char in filename(${fileName})`
      }
    }
  },
  {
    type: 'confirm',
    name: 'emulator',
    message: `Do you use firebase's emulator?`,
    default: false
  },
  {
    type: 'list',
    name: 'input',
    message: 'In which format should the contents of firebaseConfig be entered?',
    choices: ['stdin', 'file']
  }])

  let res2 = null
  if (res.input === 'file') {
    res2 = await inquirer.prompt([
    {
      type: 'input',
      name: 'filename',
      message: 'Where is the path to the file containing firebaseConfig?',
      default: './firebaseConfig.js'
    }])
  }
  // If there is no package.json in APP_ROUTE, exit
  // if there is 'react' in package.json, determine that react is used
  const packageFilePath = res.source + '/package.json'
  let packageFile = ''
  if (fileCheck(packageFilePath)) {
    packageFile = fs.readFileSync(res.source + '/package.json', {encoding: 'utf-8'})
  } else {
    console.log(`error: isn't '${res.source}' the root directory of your app?`)
    process.exit(1)
  }

  const packageFileJson = JSON.parse(packageFile)
  const objKeys = Object.keys(packageFileJson.dependencies)
  let objDevKeys = []
  if(packageFileJson.devDependencies) {
    objDevKeys = Object.keys(packageFileJson.devDependencies)
  }
  if(objKeys.includes('react') || objDevKeys.includes('react')) {
    framework = 'react'
    prefix = 'REACT_APP_'
  }

  if(objKeys.includes('typescript') || objDevKeys.includes('typescript')) {
    typescript = true
  }

  const rootTsConfig = res.source + '/tsconfig.json'
  const srcTsConfig = res.source + '/src/tsconfig.json'
  if (fs.existsSync(rootTsConfig) || fs.existsSync(srcTsConfig)) {
    typescript = true
  }

  if (res.output) {
    envFile = res.output
  }

  if (typescript) {
    fbname = 'firebase.ts'
    language = 'TypeScript'
  }

  if (res.language === 'TypeScript') {
    fbname = 'firbase.ts'
  }

  let stdin_message = ''
  if (res.input === 'stdin') {
  stdin_message = `


  Paste your firebaseEnvConfig below this and press CTRL-D
  To cancel, press CTRL-C

  `
  } else {
    stdin_message = `input config file: ${res2.filename}`
  }

  let outputEnvFileName = `${res.source}/${res.output}`.replace('\/\/','\/')
  let outputFbFileName = `${res.source}/src/${fbname}`.replace('\/\/','\/')
  const title = `
  framework type: ${framework}
  language: ${language}
  App root dir: ${res.source}
  output file: ${outputEnvFileName}, ${outputFbFileName}
  ${stdin_message}
  `
  console.log(title)

  let r = null
  if (res.input === 'stdin') {
    r = readline.createInterface({
      input: process.stdin,
    })
  } else {
    if(fileCheck(res2.filename)) {
      r = readline.createInterface({
        input: fs.createReadStream(res2.filename)
      })
    } else {
      console.error(`Error: file(${res2.filename}) not found`)
      process.exit(1)
    }
  }

  let input = []
  for await (const line of r) {
    // await input.push(line)
    input.push(line)
  }

  // If something from the stdin matches that looks like a Firebase Config,
  // put it into a firebaseEnvConfig object.
  input.forEach(element => {
    // e.g. apiKey: "hogehogehogoaoioiuasfd"
    let result = element.match(/\s*(.+)\:\s*\"(.+)\".*/)
    if(result) {
      if(result.length > 2) {
        firebaseEnvConfig[result[1]] = result[2]
      }
    }
  })

  // Split the string in CamelCase with uppercase letters and join them with '_'.
  // Reference https://easyramble.com/split-camelcase-word-with-javascript.htmlconsole.log(key)
  const isNotEmptyItem = (element) => {
    if (element === '' || element === undefined) {
      return false
    }
    return true
  };

  const separateStrWithCamelCase = (str) => {
    return str.split(/(^[a-z]+)|([A-Z][a-z]+)/).filter(isNotEmptyItem)
  };

  const keys = Object.keys(firebaseEnvConfig)
  const envLines = []

  keys.forEach((k) => {
    let left = prefix + separateStrWithCamelCase(k).join('_').toUpperCase()
    let right = firebaseEnvConfig[k]
    envLines.push(left + '=' + `"${right}"`)
    firebaseConfig[k] = 'process.env.' + left
  })

  // write to file
  let ws = fs.createWriteStream(res.source + '/' + envFile)

  envLines.forEach((line) => {
    ws.write(line + '\n')
  })

  const currentFileUrl = import.meta.url
  const templateDir = path.resolve(
    new URL(currentFileUrl).pathname,
    '../lib/template'
  )
  // read template, write YourAppDir/src/firebase.(js|ts)
  let templateFile = ''
  if (res.emulator) {
    templateFile = templateDir + '/emulator.template'
  } else {
    templateFile = templateDir + '/normal.template'
  }
  fs.readFile(templateFile, 'utf8', (err, template) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    let result = template.replace(
      '${firebaseConfig}',
      json5.stringify(firebaseConfig, null , 2)
    )

    fs.writeFile(outputFbFileName, result, err => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
    })
    const endMessage = `

use Emulator: ${res.emulator}
finished writing to
'${outputFbFileName}',
'${outputEnvFileName}'`

    console.log(endMessage)
  })
})()
