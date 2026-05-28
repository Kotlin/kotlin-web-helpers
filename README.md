# kotlin-web-helpers

This package is necessary for better integration with web targets of Kotlin Gradle Plugin

- `karma.ts` - runner for kotlin-test for Karma
- `karma-debug-framework` - Karma framework to prepare Karma server for Kotlin debug
- `karma-debug-runner` - start Karma server with necessary parameters to debug with Kotlin
- `karma-kotlin-debug-plugin` - Karma plugin which wraps framework
- `karma-kotlin-reporter` - reporter, created from `karma-teamcity-reporter`, Kotlin Gradle Plugin reads TeamCity messages and provide information to Gradle
- `karma-webpack-output` - add all files from webpack process to Karma files. Necessary because `karma-webpack` does not provide all files to Karma. So in case of, for example, wasm output, it will not be provided.
- `mocha-kotlin-reporter` - produced from Mocha TeamCity reporter, but with changes to get test log
- `nodejs.ts` - runner for kotlin-test for Node.js test tools
- `nodejs-empty.ts` - empty runner for dry-run of Node.js tests
- `tc-log-appender.js` - logger for Karma (in `config.loggers`)
- `tc-log-error-webpack.js` - specific filter of warnings for Kotlin Gradle Plugin
- `webpack-5-debug.js` - fix of problem with source maps in webpack 5 (https://github.com/webpack/webpack/issues/12951)