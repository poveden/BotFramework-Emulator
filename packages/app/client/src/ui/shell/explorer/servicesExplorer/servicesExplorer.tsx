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

import { IConnectedService } from 'msbot/bin/schema';
import * as React from 'react';
import { MouseEventHandler, SyntheticEvent } from 'react';
import { ServicePane, ServicePaneProps } from '../servicePane/servicePane';
import { ConnectedServiceEditorContainer } from './connectedServiceEditor';
import { ConnectedServicePickerPayload } from '../../../../data/action/connectedServiceActions';
import {
  AzureLoginFailedDialogContainer,
  AzureLoginSuccessDialogContainer,
  ConnectLuisAppPromptDialogContainer,
  GetStartedWithLuisDialogContainer
} from '../../../dialogs';
import { ConnectedServicePickerContainer } from './connectedServicePicker/connectedServicePickerContainer';
import * as styles from './servicesExplorer.scss';

export interface ServicesExplorerProps extends ServicePaneProps {
  services?: IConnectedService[];
  toAnimate?: { [serviceId: string]: boolean };
  openAddServiceContextMenu: (payload: ConnectedServicePickerPayload) => void;
  openServiceDeepLink: (service: IConnectedService) => void;
}

export class ServicesExplorer extends ServicePane<ServicesExplorerProps> {
  public state = {} as ServicesExplorerProps;

  public static getDerivedStateFromProps
  (newProps: ServicesExplorerProps, existingProps: ServicesExplorerProps): ServicesExplorerProps {
    if (!Object.keys(existingProps).length) {
      return newProps;
    }
    const { services: newServices } = newProps;
    const { services = [] } = existingProps;
    const state = { ...newProps };
    if (newServices.length > services.length) {
      state.expanded = true;
      state.toAnimate = {};
      const servicesMap = services.reduce((map, service) => (map[service.id] = true, map), {});
      newServices.forEach(service => {
        if (!servicesMap[service.id]) {
          state.toAnimate[service.id] = true;
        }
      });
    }

    return state;
  }

  protected get links() {
    const { services = [], toAnimate = {} } = this.state;
    return services.map((service, index) => (
      <li
        key={ index }
        className={ `${styles.link} ${toAnimate[service.id] ? styles.animateHighlight : ''} ` }
        onClick={ this.onLinkClick }
        data-index={ index }>
        { service.name }
      </li>
    ));
  }

  protected onContextMenuOverLiElement(li: HTMLLIElement) {
    super.onContextMenuOverLiElement(li);
    const { index } = li.dataset;
    const { [index]: connectedService } = this.props.services;
    this.props.openContextMenuForService(connectedService, ConnectedServiceEditorContainer);
  }

  protected onLinkClick: MouseEventHandler<HTMLLIElement> = (event: SyntheticEvent<HTMLLIElement>): void => {
    const { currentTarget } = event;
    const { index } = currentTarget.dataset;
    const { [index]: connectedService } = this.props.services;
    this.props.openServiceDeepLink(connectedService);
  }

  protected onAddIconClick = (_event: SyntheticEvent<HTMLButtonElement>): void => {
    this.props.openAddServiceContextMenu({
      azureAuthWorkflowComponents: {
        loginFailedDialog: AzureLoginFailedDialogContainer,
        loginSuccessDialog: AzureLoginSuccessDialogContainer,
        promptDialog: ConnectLuisAppPromptDialogContainer
      },
      getStartedDialog: GetStartedWithLuisDialogContainer,
      editorComponent: ConnectedServiceEditorContainer,
      pickerComponent: ConnectedServicePickerContainer,
    });
  }
}
