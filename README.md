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
? Where is the path to the file containing firebaseConfig? ../firebaseConfig.js
```
In the above case, if you specify firebaseConfig.js with contents like this firebaseConfig.js will be split into two separate files, src/firebase.js and .env.local.

../firebaseConfig.js
```js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YourApiKey",
  authDomain: "yourAuthDomain.firebaseapp.com",
  databaseURL: "https://yourdomain.firebaseio.com",
  projectId: "yourID-12345",
  storageBucket: "youID-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a11bbcc123456ab1a1b23b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
```

./src/firebase.js
```js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'process.env.VUE_APP_API_KEY',
  authDomain: 'process.env.VUE_APP_AUTH_DOMAIN',
  databaseURL: 'process.env.VUE_APP_DATABASE_URL',
  projectId: 'process.env.VUE_APP_PROJECT_ID',
  storageBucket: 'process.env.VUE_APP_STORAGE_BUCKET',
  messagingSenderId: 'process.env.VUE_APP_MESSAGING_SENDER_ID',
  appId: 'process.env.VUE_APP_APP_ID',
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);
export const firebaseApp = () => { return firebase };

export default firebase;
```

./.env.local
```bash
VUE_APP_API_KEY="YourApiKey"
VUE_APP_AUTH_DOMAIN="yourAuthDomain.firebaseapp.com"
VUE_APP_DATABASE_URL="https://yourdomain.firebaseio.com"
VUE_APP_PROJECT_ID="yourID-12345"
VUE_APP_STORAGE_BUCKET="youID-12345.appspot.com"
VUE_APP_MESSAGING_SENDER_ID="123456789012"
VUE_APP_APP_ID="1:123456789012:web:a11bbcc123456ab1a1b23b"
```
