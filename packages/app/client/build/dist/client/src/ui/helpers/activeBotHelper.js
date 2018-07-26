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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getBotDisplayName, SharedConstants } from '@bfemulator/app-shared';
import { ServiceType } from 'msbot/bin/schema';
import { mergeEndpoints } from '@bfemulator/sdk-shared';
import { hasNonGlobalTabs } from '../../data/editorHelpers';
import { CommandServiceImpl } from '../../platform/commands/commandServiceImpl';
import { getActiveBot } from '../../data/botHelpers';
import * as BotActions from '../../data/action/botActions';
import * as Constants from '../../constants';
import * as EditorActions from '../../data/action/editorActions';
import * as ExplorerActions from '../../data/action/explorerActions';
import * as FileActions from '../../data/action/fileActions';
import * as NavBarActions from '../../data/action/navBarActions';
import store from '../../data/store';
export const ActiveBotHelper = new class {
    confirmSwitchBot() {
        return __awaiter(this, void 0, void 0, function* () {
            if (hasNonGlobalTabs()) {
                return yield CommandServiceImpl.remoteCall(SharedConstants.Commands.Electron.ShowMessageBox, true, {
                    buttons: ['Cancel', 'OK'],
                    cancelId: 0,
                    defaultId: 1,
                    message: 'Switch bots? All tabs will be closed.',
                    type: 'question'
                });
            }
            else {
                return true;
            }
        });
    }
    confirmCloseBot() {
        const hasTabs = hasNonGlobalTabs();
        // TODO - localization
        if (hasTabs) {
            return CommandServiceImpl.remoteCall(SharedConstants.Commands.Electron.ShowMessageBox, true, {
                type: 'question',
                buttons: ['Cancel', 'OK'],
                defaultId: 1,
                message: 'Close active bot? All tabs will be closed.',
                cancelId: 0,
            });
        }
        else {
            return Promise.resolve(true);
        }
    }
    /** Sets a bot as active
     *  @param bot Bot to set as active
     */
    setActiveBot(bot) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // set the bot as active on the server side
                const botDirectory = yield CommandServiceImpl.remoteCall(SharedConstants.Commands.Bot.SetActive, bot);
                store.dispatch(BotActions.setActive(bot));
                store.dispatch(FileActions.setRoot(botDirectory));
                // update the app file menu and title bar
                CommandServiceImpl.remoteCall(SharedConstants.Commands.Electron.UpdateRecentBotsInMenu);
                CommandServiceImpl.remoteCall(SharedConstants.Commands.Electron.SetTitleBar, getBotDisplayName(bot));
            }
            catch (e) {
                throw new Error(`Error while setting active bot: ${e}`);
            }
        });
    }
    /** tell the server-side the active bot is now closed */
    closeActiveBot() {
        return CommandServiceImpl.remoteCall(SharedConstants.Commands.Bot.Close)
            .then(() => {
            store.dispatch(BotActions.close());
            CommandServiceImpl.remoteCall(SharedConstants.Commands.Electron.SetTitleBar, '');
        })
            .catch(err => {
            console.error('Error while closing active bot: ', err);
            throw new Error(`Error while closing active bot: ${err}`);
        });
    }
    botAlreadyOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO - localization
            return yield CommandServiceImpl.remoteCall(SharedConstants.Commands.Electron.ShowMessageBox, true, {
                buttons: ['OK'],
                cancelId: 0,
                defaultId: 0,
                message: 'This bot is already open. If you\'d like to start a conversation, ' +
                    'click on an endpoint from the Bot Explorer pane.',
                type: 'question'
            });
        });
    }
    confirmAndCreateBot(botToCreate, secret) {
        return __awaiter(this, void 0, void 0, function* () {
            // prompt the user to confirm the switch
            const result = yield this.confirmSwitchBot();
            if (result) {
                store.dispatch(EditorActions.closeNonGlobalTabs());
                try {
                    // create the bot and save to disk
                    const bot = yield CommandServiceImpl.remoteCall(SharedConstants.Commands.Bot.Create, botToCreate, secret);
                    store.dispatch(BotActions.create(bot, bot.path, secret));
                    // set the bot as active
                    yield this.setActiveBot(botToCreate);
                    // open a livechat session with the bot
                    const endpoint = bot.services
                        .find(service => service.type === ServiceType.Endpoint);
                    if (endpoint) {
                        CommandServiceImpl.call(SharedConstants.Commands.Emulator.NewLiveChat, endpoint);
                    }
                    store.dispatch(NavBarActions.select(Constants.NAVBAR_BOT_EXPLORER));
                    store.dispatch(ExplorerActions.show(true));
                }
                catch (err) {
                    console.error('Error during bot create: ', err);
                    throw new Error(`Error during bot create: ${err}`);
                }
            }
        });
    }
    browseForBotFile() {
        return CommandServiceImpl.remoteCall(SharedConstants.Commands.Electron.ShowOpenDialog, {
            buttonLabel: 'Choose file',
            filters: [{
                    extensions: ['bot'],
                    name: 'Bot Files'
                }],
            properties: ['openFile'],
            title: 'Open bot file'
        });
    }
    confirmAndOpenBotFromFile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const filename = yield this.browseForBotFile();
                if (filename) {
                    let activeBot = getActiveBot();
                    if (activeBot && activeBot.path === filename) {
                        yield this.botAlreadyOpen();
                        return;
                    }
                    try {
                        const result = this.confirmSwitchBot();
                        if (result) {
                            try {
                                store.dispatch(EditorActions.closeNonGlobalTabs());
                                const bot = yield CommandServiceImpl.remoteCall(SharedConstants.Commands.Bot.Open, filename);
                                yield CommandServiceImpl.remoteCall(SharedConstants.Commands.Bot.SetActive, bot);
                                yield CommandServiceImpl.call(SharedConstants.Commands.Bot.Load, bot);
                            }
                            catch (err) {
                                console.error('Error while trying to open bot from file: ', err);
                                throw new Error(`[confirmAndOpenBotFromFile] Error while trying to open bot from file: ${err}`);
                            }
                        }
                    }
                    catch (err) {
                        console.error('Error while calling confirmSwitchBot: ', err);
                        throw new Error(`[confirmAndOpenBotFromFile] Error while calling confirmSwitchBot: ${err}`);
                    }
                }
            }
            catch (err) {
                console.error('Error while calling browseForBotFile: ', err);
                throw new Error(`[confirmAndOpenBotFromFile] Error while calling browseForBotFile: ${err}`);
            }
        });
    }
    /**
     * Prompts the user to switch bots if necessary, and then sets the bot as active and opens
     * a livechat session.
     * @param bot The bot to be switched to. Can be a bot object with a path, or the bot path itself
     */
    confirmAndSwitchBots(bot) {
        return __awaiter(this, void 0, void 0, function* () {
            let currentActiveBot = getActiveBot();
            let botPath;
            botPath = typeof bot === 'object' ? bot.path : bot;
            if (currentActiveBot && currentActiveBot.path === botPath) {
                yield this.botAlreadyOpen();
                return;
            }
            // TODO: We need to think about merging this with confirmAndCreateBot
            console.log(`Switching to bot ${botPath}`);
            try {
                // prompt the user to confirm the switch
                const result = yield this.confirmSwitchBot();
                if (result) {
                    store.dispatch(EditorActions.closeNonGlobalTabs());
                    // if we only have the bot path, we first need to open the bot file
                    let newActiveBot;
                    if (typeof bot === 'string') {
                        try {
                            newActiveBot = yield CommandServiceImpl.remoteCall(SharedConstants.Commands.Bot.Open, bot);
                        }
                        catch (e) {
                            throw new Error(`[confirmAndSwitchBots] Error while trying to open bot at ${botPath}: ${e}`);
                        }
                    }
                    else {
                        newActiveBot = bot;
                    }
                    // set the bot as active
                    yield this.setActiveBot(newActiveBot);
                    // find a suitable endpoint configuration
                    let endpoint;
                    const overridesArePresent = newActiveBot.overrides && newActiveBot.overrides.endpoint;
                    // if an endpoint id was specified, use that endpoint, otherwise use the first endpoint found
                    if (overridesArePresent && newActiveBot.overrides.endpoint.id) {
                        endpoint = newActiveBot.services
                            .find(service => service.type === ServiceType.Endpoint
                            && service.id === newActiveBot.overrides.endpoint.id);
                    }
                    else {
                        endpoint = newActiveBot.services
                            .find(service => service.type === ServiceType.Endpoint);
                    }
                    // apply endpoint overrides here
                    if (endpoint && overridesArePresent) {
                        endpoint = mergeEndpoints(endpoint, newActiveBot.overrides.endpoint);
                    }
                    // open a livechat with the configured endpoint
                    if (endpoint) {
                        yield CommandServiceImpl.call(SharedConstants.Commands.Emulator.NewLiveChat, endpoint);
                    }
                    store.dispatch(NavBarActions.select(Constants.NAVBAR_BOT_EXPLORER));
                    store.dispatch(ExplorerActions.show(true));
                }
            }
            catch (e) {
                console.error(`Error while trying to switch to bot: ${botPath}`);
                throw new Error(`[confirmAndSwitchBots] Error while trying to switch to bot ${botPath}: ${e}`);
            }
        });
    }
    confirmAndCloseBot() {
        let activeBot = getActiveBot();
        if (!activeBot) {
            return Promise.resolve();
        }
        console.log(`Closing active bot`);
        return this.confirmCloseBot()
            .then((result) => {
            if (result) {
                store.dispatch(EditorActions.closeNonGlobalTabs());
                this.closeActiveBot()
                    .catch(err => new Error(err));
            }
        })
            .catch(err => {
            console.error('Error while closing active bot: ', err);
            throw new Error(`Error while closing active bot: ${err}`);
        });
    }
};
//# sourceMappingURL=activeBotHelper.js.map