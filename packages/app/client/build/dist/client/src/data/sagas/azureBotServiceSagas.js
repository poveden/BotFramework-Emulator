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
import { ServiceType } from 'msbot/bin/schema';
import { call, takeEvery, takeLatest } from 'redux-saga/effects';
import { CommandServiceImpl } from '../../platform/commands/commandServiceImpl';
import { DialogService } from '../../ui/dialogs/service';
import { LAUNCH_AZURE_BOT_SERVICE_EDITOR, OPEN_AZURE_BOT_SERVICE_CONTEXT_MENU, OPEN_AZURE_BOT_SERVICE_DEEP_LINK } from '../action/azureBotServiceActions';
import { SharedConstants } from '@bfemulator/app-shared';
function* launchAzureBotServiceEditor(action) {
    const { azureBotServiceEditorComponent, azureBotService = {} } = action.payload;
    const result = yield DialogService
        .showDialog(azureBotServiceEditorComponent, { azureBotService });
    if (result) {
        yield CommandServiceImpl
            .remoteCall(SharedConstants.Commands.Bot.AddOrUpdateService, ServiceType.AzureBotService, result);
    }
}
function* openAzureBotServiceContextMenu(action) {
    const menuItems = [
        { label: 'Edit settings', id: 'edit' },
        { label: 'Open in web portal', id: 'open' },
        { label: 'Remove', id: 'forget' }
    ];
    const response = yield call(CommandServiceImpl
        .remoteCall.bind(CommandServiceImpl), SharedConstants.Commands.Electron.DisplayContextMenu, menuItems);
    switch (response.id) {
        case 'edit':
            yield* launchAzureBotServiceEditor(action);
            break;
        case 'open':
            yield* openAzureBotServiceDeepLink(action);
            break;
        case 'forget':
            yield* removeAzureBotServiceFromActiveBot(action.payload.azureBotService);
            break;
        default:// canceled context menu
            return;
    }
}
function* openAzureBotServiceDeepLink(action) {
    const { tenantId, subscriptionId, resourceGroup, id } = action.payload.azureBotService;
    const thankYouTsLint = `https://ms.portal.azure.com/#@${tenantId}/resource/subscriptions/${subscriptionId}`;
    const link = `${thankYouTsLint}/resourceGroups/${resourceGroup}/providers/Microsoft.BotService/botServices/${id}`;
    yield CommandServiceImpl.remoteCall(SharedConstants.Commands.Electron.OpenExternal, link + '/channels');
}
function* removeAzureBotServiceFromActiveBot(azureBotService) {
    // TODO - localization
    const result = yield CommandServiceImpl.remoteCall(SharedConstants.Commands.Electron.ShowMessageBox, true, {
        type: 'question',
        buttons: ['Cancel', 'OK'],
        defaultId: 1,
        message: `Remove QnA service ${azureBotService.name}. Are you sure?`,
        cancelId: 0,
    });
    if (result) {
        yield CommandServiceImpl
            .remoteCall(SharedConstants.Commands.Bot.RemoveService, ServiceType.AzureBotService, azureBotService.id);
    }
}
export function* azureBotServiceSagas() {
    yield takeLatest(LAUNCH_AZURE_BOT_SERVICE_EDITOR, launchAzureBotServiceEditor);
    yield takeEvery(OPEN_AZURE_BOT_SERVICE_CONTEXT_MENU, openAzureBotServiceContextMenu);
    yield takeEvery(OPEN_AZURE_BOT_SERVICE_DEEP_LINK, openAzureBotServiceDeepLink);
}
//# sourceMappingURL=azureBotServiceSagas.js.map