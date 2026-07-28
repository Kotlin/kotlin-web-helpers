/*
 * Copyright 2010-2026 JetBrains s.r.o. and Kotlin Programming Language contributors.
 * Use of this source code is governed by the Apache 2.0 license that can be found in the license/LICENSE.txt file.
 */

/**
 * Kotlin Test Runner adapter for browsers using Mocha.
 * Check static/test.html for usage reference
 */

if (typeof window === 'undefined') {
    throw new Error('This code can only be executed in a browser environment');
}

import {CliArgsParser, getDefaultCliDescription} from "./src/CliArgsParser";
import {runWithFilteringAdapter} from "./src/Adapter";
import {KotlinTestRunner} from "./src/KotlinTestRunner";
import {TeamcityForWeb} from "./mocha-kotlin-reporter";

const parser = new CliArgsParser(
    getDefaultCliDescription(),
    (exitCode) => {
        throw new Error(`Exit with ${exitCode}`);
    }
);

const preExistingConfig: KotlinTestBrowserRunnerConfig = (window.kotlinTestBrowserRunner as KotlinTestBrowserRunnerConfig) || {};

const runnerState = {
    loadJasmineTests: preExistingConfig.loadJasmineTests,
    kotlinJsTestsEntry: preExistingConfig.kotlinJsTestsEntry,
    kotlinWasmJsTestsEntry: preExistingConfig.kotlinWasmJsTestsEntry,
    reporter: preExistingConfig.reporter || TeamcityForWeb,
    reporterOptions: preExistingConfig.reporterOptions || {},
    mochaSetupOptions: preExistingConfig.mochaSetupOptions || {},
    kotlinTestCliArguments: preExistingConfig.kotlinTestCliArguments || [],
    adapterTransformer: preExistingConfig.adapterTransformer,
    onComplete: preExistingConfig.onComplete,
    mocha: preExistingConfig.mocha || window.mocha,
    testsFinishedMarker: preExistingConfig.testsFinishedMarker || 'KOTLIN-TEST-FINISHED',
}

const runner: KotlinTestBrowserRunner = {
    configure(config: KotlinTestBrowserRunnerConfig) {
        if (config.loadJasmineTests !== undefined) runnerState.loadJasmineTests = config.loadJasmineTests;
        if (config.kotlinJsTestsEntry !== undefined) runnerState.kotlinJsTestsEntry = config.kotlinJsTestsEntry;
        if (config.kotlinWasmJsTestsEntry !== undefined) runnerState.kotlinWasmJsTestsEntry = config.kotlinWasmJsTestsEntry;
        if (config.reporter !== undefined) runnerState.reporter = config.reporter;
        if (config.reporterOptions !== undefined) runnerState.reporterOptions = config.reporterOptions;
        if (config.mochaSetupOptions !== undefined) runnerState.mochaSetupOptions = config.mochaSetupOptions;
        if (config.kotlinTestCliArguments !== undefined) runnerState.kotlinTestCliArguments = config.kotlinTestCliArguments;
        if (config.adapterTransformer !== undefined) runnerState.adapterTransformer = config.adapterTransformer;
        if (config.onComplete !== undefined) runnerState.onComplete = config.onComplete;
        if (config.mocha !== undefined) runnerState.mocha = config.mocha;
        if (config.testsFinishedMarker !== undefined) runnerState.testsFinishedMarker = config.testsFinishedMarker;
    },

    async run() {
        const mocha = runnerState.mocha || window.mocha;
        if (!mocha) {
            throw new Error('Mocha is not available. Make sure mocha.js is loaded before invoking the Kotlin Test browser runner.');
        }
        if (runnerState.kotlinJsTestsEntry != null) {
            try {
                await import(runnerState.kotlinJsTestsEntry);
            } catch (e) {
                console.error('Failed to load Kotlin JS tests entry point', e);
            }
        }
        if (runnerState.kotlinWasmJsTestsEntry != null) {
            try {
                let module = await import(runnerState.kotlinWasmJsTestsEntry);
                module['startUnitTests']()
            } catch (e) {
                console.error('Failed to load Kotlin WASM JS tests entry point', e);
            }
        }
        if (runnerState.loadJasmineTests != null) {
            try {
                await runnerState.loadJasmineTests();
            } catch (e) {
                console.error('Failed to load Jasmine tests', e);
            }
        }
        mocha.run(function (failures: number) {
            if (typeof runnerState.onComplete === 'function') {
                runnerState.onComplete(failures);
            }

            // Kotlin Test Runner owner will close page after this marker.
            console.log(runnerState.testsFinishedMarker);
        });
    }
};

const mochaInstance = runnerState.mocha || window.mocha;
if (mochaInstance && typeof mochaInstance.setup === 'function') {
    const setupOptions = Object.assign(
        {ui: 'bdd'},
        runnerState.mochaSetupOptions
    );
    mochaInstance.setup(setupOptions);
    mochaInstance.reporter(runnerState.reporter, runnerState.reporterOptions);
}

const currentAdapterTransformer: (current: KotlinTestRunner) => KotlinTestRunner
    = window.kotlinTest && window.kotlinTest.adapterTransformer;

const adapterTransformer: (current: KotlinTestRunner) => KotlinTestRunner = (current) => {
    const upstream = currentAdapterTransformer ? currentAdapterTransformer(current) : current;
    const filtered = runWithFilteringAdapter(upstream, parser.parse(runnerState.kotlinTestCliArguments));
    return typeof runnerState.adapterTransformer === 'function'
        ? runnerState.adapterTransformer(filtered)
        : filtered;
};

window.kotlinTest = {
    adapterTransformer: adapterTransformer,
    rawArgumentsProvider: window.kotlinTest && window.kotlinTest.rawArgumentsProvider
};

// User code now should describe tests via Jasmine spec
// And call `window.kotlinTestBrowserRunner.run` when ready.
window.kotlinTestBrowserRunner = runner;