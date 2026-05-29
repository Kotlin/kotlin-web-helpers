/*
 * Copyright 2010-2026 JetBrains s.r.o. and Kotlin Programming Language contributors.
 * Use of this source code is governed by the Apache 2.0 license that can be found in the LICENSE file.
 */

export interface TeamcityForWebReporterOptions {
    flowId?: string;
    useStdError?: boolean;
    recordHookFailures?: boolean;
    actualVsExpected?: boolean;
    topLevelSuite?: string;
    log?: (message: string) => void;
    logError?: (message: string) => void;
    Base?: Function;
}

export interface TeamcityForWebOptions {
    reporterOptions?: TeamcityForWebReporterOptions;
}

export function TeamcityForWeb(runner: any, options?: TeamcityForWebOptions): void;
export function Teamcity(runner: any, options?: TeamcityForWebOptions): void;
