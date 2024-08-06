/*
 * Copyright 2010-2020 JetBrains s.r.o. and Kotlin Programming Language contributors.
 * Use of this source code is governed by the Apache 2.0 license that can be found in the license/LICENSE.txt file.
 */

import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

import pckg from "./package.json" with { type: 'json' };

export default [
    {
        input: './nodejs.ts',
        output: {
            file: 'dist/kotlin-test-nodejs-runner.js',
            format: 'cjs',
            banner: '#!/usr/bin/env node',
            sourcemap: true
        },
        plugins: plugins()
    },
    {
        input: './nodejs-empty.ts',
        output: {
            file: 'dist/kotlin-test-nodejs-empty-runner.js',
            format: 'cjs',
            banner: '#!/usr/bin/env node',
            sourcemap: true
        },
        plugins: plugins()
    },
    {
        input: './karma.ts',
        output: {
            file: 'dist/kotlin-test-karma-runner.js',
            format: 'cjs',
            sourcemap: true
        },
        plugins: plugins()
    },
    {
        input: './karma-kotlin-debug-plugin.js',
        output: {
            file: 'dist/karma-kotlin-debug-plugin.js',
            format: 'esm'
        }
    },
    {
        input: './karma-debug-runner.js',
        output: {
            file: 'dist/karma-debug-runner.js',
            format: 'cjs'
        }
    },
    {
        input: './karma-debug-framework.js',
        output: {
            file: 'dist/karma-debug-framework.js',
            format: 'cjs'
        }
    },
    {
        input: './karma-kotlin-reporter.js',
        external: ['path', 'util'],
        output: {
            file: 'dist/karma-kotlin-reporter.js',
            format: 'cjs'
        }
    },
    {
        input: './tc-log-appender.js',
        output: {
            file: 'dist/tc-log-appender.js',
            format: 'cjs'
        }
    },
    {
        input: './tc-log-error-webpack.js',
        output: {
            file: 'dist/tc-log-error-webpack.js',
            format: 'cjs'
        }
    },
    {
        input: './webpack-5-debug.js',
        output: {
            file: 'dist/webpack-5-debug.js',
            format: 'cjs'
        }
    },
    {
        input: './mocha-kotlin-reporter.js',
        external: ['path', 'util'],
        output: {
            file: 'dist/mocha-kotlin-reporter.js',
            format: 'cjs'
        }
    },
    {
        input: './karma-webpack-output.js',
        output: {
            file: 'dist/karma-webpack-output.js',
            format: 'cjs'
        }
    }
]

function plugins() {
    return [
        nodeResolve({
                        jsnext: true,
                        main: true
                    }),
        commonjs(),
        typescript({
                       tsconfig: "tsconfig.json"
                   }),
        terser({
                   compress: {
                       toplevel: true,
                       global_defs: {
                           DEBUG: false,
                           VERSION: pckg.version,
                           DESCRIPTION: pckg.description
                       }
                   }
               })
    ]
}