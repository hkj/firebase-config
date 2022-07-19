#!/usr/bin/env node
'use strict'

const fs = require('fs')
const yargs = require('yargs/yargs')

/*
I use Firebase with Vue and handle firebaseConfig as an environment variable by reading it
from an external file. After doing this many times, I decided to reduce the hassle.
*/
let prefix = 'VUE_APP_'
let envFile = '.env.local'
let typescript = false
let fbname = 'firebase.js'

let firebaseConfig = {}
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
  demandOption: true
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

console.log(
  `framework type: ${argv.type}\n` +
  `output file: ${argv.output}, ${fbname}\n` +
  `application root dir: ${argv.source}\n` +
  '\nPaste your firebaseConfig below this and press CTRL-D\n'
  + 'To cancel, press CTRL-C.\n\n'
)

// read from stdin
let input = fs.readFileSync('/dev/stdin', 'utf8')
.toString().split('\n')

// If something from the stdin matches that looks like a Firebase Config,
// put it into a firebaseConfig object.
input.forEach(element => {
  // e.g. apiKey: "hogehogehogoaoioiuasfd"
  let result = element.match(/\s*(.+)\:\s*\"(.+)\".*/)
  if(result) {
    if(result.length > 2) {
      firebaseConfig[result[1]] = result[2]
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

const keys = Object.keys(firebaseConfig)
const envLines = []

keys.forEach((k) => {
  let left = prefix + separateStrWithCamelCase(k).join('_').toUpperCase()
  let right = firebaseConfig[k]
  envLines.push(left + ' = ' + right)
})

// write to file
let ws = fs.createWriteStream(envFile)

envLines.forEach((line) => {
  ws.write(line + '\n')
})
