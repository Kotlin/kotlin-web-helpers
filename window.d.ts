/*
 * Copyright 2010-2019 JetBrains s.r.o. and Kotlin Programming Language contributors.
 * Use of this source code is governed by the Apache 2.0 license that can be found in the LICENSE file.
 */

import {KotlinTestRunner} from "./src/KotlinTestRunner";

declare global {
    interface Window {
        __karma__: {
            config: {
                args: string[]
            },
            result: (result: BrowserResult) => void
        }

        kotlinTest: {
            adapterTransformer: (current: KotlinTestRunner) => KotlinTestRunner
            /**
             * Configure global arguments provider
             */
            rawArgumentsProvider?: () => string[]
        }

        /**
         * Mocha global, available when the mocha browser bundle is loaded.
         */
        mocha: MochaGlobal

        /**
         * Extensibility hook for the Mocha-based Kotlin Test browser runner.
         *
         * Users may pre-populate this object (before loading the runner script) to
         * customise behaviour, or read/modify it after the runner script has loaded.
         */
        kotlinTestBrowserRunner?: KotlinTestBrowserRunner
    }

    interface MochaGlobal {
        setup(options: any): MochaGlobal
        run(callback?: (failures: number) => void): any
        reporters?: any
        reporter(reporter: any, reporterOptions?: { [key: string]: any }): MochaGlobal
        Runner?: any
        [key: string]: any
    }

    interface KotlinTestBrowserRunnerConfig {
        /**
         * Loads Jasmine-like tests on a global scope.
         */
        loadJasmineTests?: () => Promise<void>

        /**
         * Path to esm module with js tests entry point.
         */
        kotlinJsTestsEntry?: string

        /**
         * Path to esm module with wasm js tests entry point.
         */
        kotlinWasmJsTestsEntry?: string

        /**
         * Mocha reporter constructor. Defaults to TeamcityForWeb (mocha-kotlin-reporter.js).
         */
        reporter?: any
        /**
         * Reporter-specific options (passed as `options.reporterOptions` to the reporter).
         */
        reporterOptions?: { [key: string]: any }
        /**
         * Options forwarded to `mocha.setup()`. Use this to switch UI, set timeout, etc.
         * `ui` defaults to "bdd"; `reporter` is overridden by `reporter` above.
         */
        mochaSetupOptions?: { [key: string]: any }
        /**
         * Raw CLI-style arguments of Kotlin Test Runner specification (for example `--include`, `--exclude`).
         * Defaults to reading the `kotlinTestRawArgsJson` URL query parameter:
         *
         * test.html?kotlinTestRawArgsJson=['--include', '*Foo', '--exclude', '*Bar']
         *
         * Test filters are compatible with Gradle and Intellij IDEA format.
         */
        kotlinTestCliArguments?: string[]
        /**
         * Additional adapter transformer applied after filtering. Allows users to inject
         * extra decorators around the Kotlin Test runner (e.g. custom logging).
         *
         * Or extra
         */
        adapterTransformer?: (current: KotlinTestRunner) => KotlinTestRunner
        /**
         * Callback invoked when Mocha finishes the test run with the failure count.
         */
        onComplete?: (failures: number) => void
        /**
         * Reference to the Mocha global. Defaults to `window.mocha`.
         */
        mocha?: MochaGlobal

        /**
         * Marker that will be printed to console.log when all tests are finished and browser page can be closed.
         * Defaults to query parameter `?kotlinTestFinishedMarker` || 'KOTLIN-TEST-FINISHED'
         */
        testsFinishedMarker?: string
    }

    interface KotlinTestBrowserRunner {
        /**
         * Merge new configuration into the runner. Must be called before `run()`.
         */
        configure(config: KotlinTestBrowserRunnerConfig): void

        /**
         * Run Mocha.
         */
        run(): Promise<void>
    }
}

interface BrowserResult {
}