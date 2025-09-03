/*
 * Copyright 2010-2019 JetBrains s.r.o. and Kotlin Programming Language contributors.
 * Use of this source code is governed by the Apache 2.0 license that can be found in the LICENSE file.
 */

'use strict';

import {fixBrowserActivityTimeout, fixMochaTimeout} from "./src/DebugConfigurator";

const initDebug = function (injector, config) {
    configureTimeouts(injector, config)
};

function configureTimeouts(injector, config) {
    const webServer = injector.get('webServer');
    if (webServer) {
        webServer.timeout = 0
    }
    const socketServer = injector.get('socketServer');
    if (socketServer && typeof socketServer.set === 'function') {
        // Disable socket.io heartbeat (ping) to avoid browser disconnecting when debugging tests,
        // because no ping requests are sent when test execution is suspended on a breakpoint.
        // Default values are not enough for suspended execution:
        //    'heartbeat timeout' (pingTimeout) = 60000 ms
        //    'heartbeat interval' (pingInterval) = 25000 ms
        socketServer.set('heartbeat timeout', 24 * 60 * 60 * 1000);
        socketServer.set('heartbeat interval', 24 * 60 * 60 * 1000)
    }

    fixMochaTimeout(config);
    fixBrowserActivityTimeout(config);
}

initDebug.$inject = ['injector', 'config'];

module.exports = initDebug;