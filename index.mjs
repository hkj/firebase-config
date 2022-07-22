#!/usr/bin/env node

import * as fs from 'fs'
import yargs from 'yargs'
import enquirer from 'enquirer'
import * as readline from 'readline'
import json5 from 'json5'

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

const argv = yargs(process.argv.slice(2))
.usage(`Usage: $0 [options]\nPaste the Firebase Config in the stdin`)
.option('output', {
  alias: 'o',
  describe: 'output file',
  default: `${envFile}`
})
.option('type', {
  alias: 't',
  describe: 'framework type, vue or react',
})
.option('source', {
  alias: 's',
  describe: 'application root dir',
  default: './'
})
.help().alias('h', 'help')
.version().alias('v', 'version')
.argv

envFile = argv.output

// TypeScript Check
let dir = argv.source

if (fs.existsSync(dir + '/tsconfig.json')) {
  typescript = true
} else if (fs.existsSync(dir + '/src/tsconfig.json')) {
  typescript = true
} else {
  typescript = false
}

if (typescript) {
  fbname = 'firebase.ts'
}

(async () => {
  let res = await enquirer.prompt([
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
    message: 'Enviroment Variables file name?'
  },
  {
    type: 'select',
    name: 'input',
    message: 'In which format should the contents of firebaseConfig be entered?',
    choices: ['stdin', 'file']
  }
])
let res2 = null
if (res.input === 'file') {
  res2 = await enquirer.prompt([
  {
    type: 'input',
    name: 'filename',
    message: 'Where is the path to the file containing firebaseConfig?'
  }])
}
const packageFilePath = res.source + '/package.json'
let packageFile = ''
if (fileCheck(packageFilePath)) {
  packageFile = fs.readFileSync(res.source + '/package.json', {encoding: 'utf-8'})
} else {
  console.error(`error: isn't '${res.source}' the root directory of your app?`)
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
}

const title = `
framework type: ${framework}
language: ${language}
App root dir: ${res.source}
output file: ${res.source}/${res.output}, ${res.source}/src/${fbname}
${stdin_message}
`
console.log(title)

let r = null
if (res.input === 'stdin') {
  r = readline.createInterface({
    input: process.stdin,
  })
} else {
  r = readline.createInterface({
    input: fs.createReadStream(res2.filename)
  })
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
// Avoid displaying [object object]
firebaseConfig = json5.stringify(firebaseConfig, null, 2)
const result =
`
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = ${firebaseConfig}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
`

fs.writeFile(res.source + '/src/' + fbname, result, err => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
})

// const fb = fs.createWriteStream(res.source + '/src/' + fbname)
// result.forEach((l) => {
//   fb.write(l + '\n')
// })
// console.log(result)
})()
