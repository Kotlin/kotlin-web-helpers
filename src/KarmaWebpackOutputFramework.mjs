/*
 * Copyright 2010-2024 JetBrains s.r.o. and Kotlin Programming Language contributors.
 * Use of this source code is governed by the Apache 2.0 license that can be found in the LICENSE file.
 */

import fs from "fs";
import path from "path";

export function KarmaWebpackOutputFramework(config) {
    // This controller is instantiated and set during the preprocessor phase.
    const controller = config.__karmaWebpackController;

    // only if webpack has instantiated its controller
    if (!controller) {
        console.warn(
            "Webpack has not instantiated controller yet.\n" +
            "Check if you have enabled webpack preprocessor and framework before this framework"
        )
        return
    }

    // make sure tmp folder exists
    const outputPath = controller.outputPath;

    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }

    config.files.push({
        pattern: `${outputPath}/**/*`,
        included: false,
        served: true,
        watched: false
    })

    config.webpackCopy?.forEach(file => {
        fs.copyFileSync(file, path.resolve(outputPath, path.basename(file)));
    })
}

KarmaWebpackOutputFramework.$inject = ['config'];