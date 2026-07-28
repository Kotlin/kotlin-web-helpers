/**
 * From mocha-teamcity-reporter
 * The MIT License
 * Copyright (c) 2016 Jamie Sherriff
 */

/**
 * Teamcity doc reference https://confluence.jetbrains.com/display/TCD10/Build+Script+Interaction+with+TeamCity
 *
 * Module dependencies.
 */
'use strict';

import {
    formatMessage,
    SUITE_END,
    SUITE_END_NO_DURATION,
    SUITE_START,
    TEST_END,
    TEST_END_NO_DURATION,
    TEST_FAILED,
    TEST_FAILED_COMPARISON,
    TEST_IGNORED,
    TEST_START
} from "./src/teamcity-format";

function isNil(value) {
    return value == null; 	// eslint-disable-line
}

function configureHtmlReporter(teamcityForWeb, Reporters, runner, options) {
    if (!Reporters || !Reporters.HTML) {
        console.error("Unable to configure HTML reporter: Mocha HTML reporter not found")
        return;
    }

    const htmlAttached = !!(Reporters && Reporters.HTML
        && typeof document !== 'undefined' && document.getElementById('mocha'));
    if (htmlAttached) {
        // Dirty hack: HTML has own prototype functions, we have to inherit them.
        // But I don't want to extend TeamcityForWeb.prototype beforehand.
        const instanceProto = Object.create(Reporters.HTML.prototype);
        Object.setPrototypeOf(teamcityForWeb, instanceProto);
        Reporters.HTML.call(teamcityForWeb, runner, options);
    } else {
        console.warn("No base reporter provided for Mocha." +
            " Please configure Teamcity reporter with reporterOptions.Base = Mocha.reporters.Base or other.")
    }
}

function configureBaseReporter(teamcityForWeb, Reporters, runner, options) {
    Reporters.Base.call(teamcityForWeb, runner, options)
}

/**
 * Core TeamCity reporter implementation that does not depend on Node.js `process` globals.
 * Suitable for running Mocha in a browser. All options must be provided explicitly via
 * `options.reporterOptions`.
 *
 * When running in a browser that exposes Mocha's HTML reporter via
 * `window.Mocha.reporters.HTML` and the page contains a `<div id="mocha"></div>`,
 * the HTML reporter is attached automatically so test progress is rendered on the
 * page in addition to TeamCity service messages going to the console.
 *
 * Accepted reporterOptions:
 *   - flowId            (string)
 *   - useStdError       (boolean)
 *   - recordHookFailures (boolean)
 *   - actualVsExpected  (boolean)
 *   - topLevelSuite     (string)
 *   - log               (function) optional custom logger, defaults to console.log
 *   - logError          (function) optional custom error logger, defaults to console.error
 *   - Base              (function) optional Mocha Base reporter constructor; if provided,
 *                       it will be invoked as Base.call(this, runner) to install
 *                       Mocha's standard stats tracking on `this`. Ignored when the
 *                       HTML reporter is auto-attached (HTML invokes Base itself).
 *
 * @param {Runner} runner
 * @param {options} options
 * @api public
 */
function TeamcityForWeb(runner, options) {
    options = options || {};
    const reporterOptions = options.reporterOptions || {};

    const flowId = reporterOptions.flowId || '';
    const useStdError = !!reporterOptions.useStdError;
    const recordHookFailures = !!reporterOptions.recordHookFailures;
    const actualVsExpected = !!reporterOptions.actualVsExpected;
    const topLevelSuite = reporterOptions.topLevelSuite;

    const log = reporterOptions.log || function (msg) { console.log(msg); };
    const logError = reporterOptions.logError || function (msg) { console.error(msg); };

    if (typeof reporterOptions.Base === 'function') {
        if (typeof reporterOptions.alsoWithHtml !== 'undefined') {
            console.warn("Reporter option 'alsoWithHtml' has no effect. Because custom reporterOptions.Base was provided.")
        }
        reporterOptions.Base.call(this, runner);
    } else {
        const alsoWithHtml = reporterOptions.alsoWithHtml || true;
        const Reporters = (typeof window !== 'undefined' && window.Mocha && window.Mocha.reporters) || null;
        if (alsoWithHtml) {
            configureHtmlReporter(this, Reporters, runner, options)
        } else {
            configureBaseReporter(this, Reporters, runner, options)
        }
    }

    const stats = this.stats || runner.stats;

    runner.on('suite', function (suite) {
        if (suite.root) {
            if (topLevelSuite) {
                log(formatMessage(SUITE_START, topLevelSuite, flowId));
            }
            return;
        }
        suite.startDate = new Date();
        log(formatMessage(SUITE_START, suite.title, flowId));
    });

    runner.on('test', function (test) {
        log(formatMessage(TEST_START, test.title, flowId));
    });

    function formatErrorDetails(err) {
        const stack = err.stack || '';
        const message = err.message || ''
        const name = err.name || ''
        return stack.startsWith(name) ? stack : (name + `: ` + message + '\n' + stack);
    }

    runner.on('fail', function (test, err) {
        const details = formatErrorDetails(err);

        if (actualVsExpected && (err.actual && err.expected)) {
            if (useStdError) {
                logError(formatMessage(TEST_FAILED_COMPARISON, test.title, err.message, details, err.actual,
                    err.expected, flowId));
            }
            else {
                log(formatMessage(TEST_FAILED_COMPARISON, test.title, err.message, details, err.actual,
                    err.expected, flowId));
            }
        } else {
            if (useStdError) {
                logError(formatMessage(TEST_FAILED, test.title, err.message, details, flowId));
            }
            else {
                log(formatMessage(TEST_FAILED, test.title, err.message, details, flowId));
            }
        }
    });

    runner.on('pending', function (test) {
        log(formatMessage(TEST_IGNORED, test.title, test.title, flowId));
    });

    runner.on('test end', function (test) {
        // This is necessary not to emit `test end` event on skipped tests
        if (test.isPending()) return

        if (isNil(test.duration)) {
            log(formatMessage(TEST_END_NO_DURATION, test.title, flowId));
        }
        else {
            log(formatMessage(TEST_END, test.title, test.duration.toString(), flowId));
        }
    });

    runner.on('hook', function (test) {
        if (recordHookFailures) {
            log(formatMessage(TEST_START, test.title, flowId));
        }
    });

    runner.on('suite end', function (suite) {
        if (suite.root) return;
        log(formatMessage(SUITE_END, suite.title, new Date() - suite.startDate, flowId));
    });

    runner.on('end', function () {
        let duration;
        (typeof stats === 'undefined' || stats === null) ? duration = null : duration = stats.duration;
        if (topLevelSuite) {
            isNil(duration) ? log(formatMessage(SUITE_END_NO_DURATION, topLevelSuite, flowId)) : log(
                formatMessage(SUITE_END, topLevelSuite, duration, flowId));
        }
    });
}

/**
 * Node.js Mocha Teamcity reporter. Reads defaults from `process.env` and `process.pid`,
 * then delegates to `TeamcityForWeb` for the actual event handling.
 *
 * @param {Runner} runner
 * @param {options} options
 * @api public
 */
function Teamcity(runner, options) {
    options = options || {};
    const reporterOptions = options.reporterOptions || {};

    const processPID = process.pid.toString();

    let flowId, useStdError, recordHookFailures, actualVsExpected;
    (reporterOptions.flowId) ? flowId = reporterOptions.flowId : flowId = process.env['MOCHA_TEAMCITY_FLOWID'] || processPID;
    (reporterOptions.useStdError) ? useStdError = reporterOptions.useStdError : useStdError = process.env['USE_STD_ERROR'];
    (reporterOptions.recordHookFailures) ? recordHookFailures = reporterOptions.recordHookFailures : recordHookFailures =
        process.env['RECORD_HOOK_FAILURES'];
    (reporterOptions.actualVsExpected) ? actualVsExpected = reporterOptions.actualVsExpected : actualVsExpected =
        process.env['ACTUAL_VS_EXPECTED'];
    (useStdError) ? useStdError = (useStdError.toLowerCase() === 'true') : useStdError = false;
    (recordHookFailures) ? recordHookFailures = (recordHookFailures.toLowerCase() === 'true') : recordHookFailures = false;
    actualVsExpected ? actualVsExpected = (actualVsExpected.toLowerCase() === 'true') : actualVsExpected = false;
    const topLevelSuite = reporterOptions.topLevelSuite || process.env['MOCHA_TEAMCITY_TOP_LEVEL_SUITE'];

    const Base = require('mocha').reporters.Base;

    TeamcityForWeb.call(this, runner, {
        reporterOptions: {
            flowId: flowId,
            useStdError: useStdError,
            recordHookFailures: recordHookFailures,
            actualVsExpected: actualVsExpected,
            topLevelSuite: topLevelSuite,
            alsoWithHtml: true, // this is redundant as below we pass "Base"
            Base: Base
        }
    });
}


/**
 * Expose both `Teamcity` (Node.js) and `TeamcityForWeb` (browser).
 */
if (typeof module !== 'undefined') {
    module.exports = Teamcity;
    module.exports.Teamcity = Teamcity;
    module.exports.TeamcityForWeb = TeamcityForWeb;
}

export { Teamcity, TeamcityForWeb };