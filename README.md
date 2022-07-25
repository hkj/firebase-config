# firebase-config
Something to help configure Firebase when using vue or React.

Tools for Vue or React.Separate In answer to the question,
Firebase configuration into environment variable files and firebase.js, etc.

Originally, I wanted to cut them out into other files so that only the files that read them would be registered with github, etc., so that API keys and other information would not be registered with github, etc.

## Usage
```shell
$ npm install @hkj_50/firebase-config
$ npx firebase-config

? Where is the root dir of the your App? ./vue-app
? Enviroment Variables file name? .env.local
? Do you use firebase's emulator? No
? In which format should the contents of firebaseConfig be entered? file
? Where is the path to the file containing firebaseConfig? ./firebaseConfig.js
```

