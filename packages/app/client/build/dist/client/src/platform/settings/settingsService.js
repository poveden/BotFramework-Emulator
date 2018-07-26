//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
//
// Microsoft Bot Framework: http://botframework.com
//
// Bot Framework Emulator Github:
// https://github.com/Microsoft/BotFramwork-Emulator
//
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
import { DisposableImpl } from '@bfemulator/sdk-shared';
import { SharedConstants } from '@bfemulator/app-shared';
export function registerCommands(commandRegistry) {
    commandRegistry.registerCommand(SharedConstants.Commands.Settings.ReceiveGlobalSettings, (settings) => {
        SettingsService.emulator.url = (settings.url || '').replace('[::]', '127.0.0.1');
        SettingsService.emulator.cwd = (settings.cwd || '').replace(/\\/g, '/');
    });
}
class EmulatorSettingsImpl {
    get url() {
        if (!this._url || !this._url.length) {
            throw new Error('Emulator url not set');
        }
        return this._url;
    }
    set url(value) {
        this._url = value;
    }
    get cwd() {
        if (!this._cwd || !this._cwd.length) {
            throw new Error('Emulator cwd not set');
        }
        return this._cwd;
    }
    set cwd(value) {
        this._cwd = value;
    }
    get cwdAsBase() {
        let base = this.cwd;
        if (!base.startsWith('/')) {
            base = `/${base}`;
        }
        return base;
    }
}
export const SettingsService = new class extends DisposableImpl {
    get emulator() { return this._emulator; }
    init() { return null; }
    constructor() {
        super();
        this._emulator = new EmulatorSettingsImpl();
    }
};
//# sourceMappingURL=settingsService.js.map