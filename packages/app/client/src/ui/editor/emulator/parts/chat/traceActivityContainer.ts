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

import { connect } from 'react-redux';
import { ValueTypes } from '@bfemulator/app-shared';

import { RootState } from '../../../../../state';
import { getActivityTargets } from '../../../../../utils';

import { TraceActivity, TraceActivityProps } from './traceActivity';

function mapStateToProps(state: RootState, { documentId }: { documentId: string }): TraceActivityProps {
  const { highlightedObjects = [], inspectorObjects = [{}] } = state.chat.chats[documentId];
  let selectedActivity = inspectorObjects[0];
  // The log panel gives us the entire trace while
  // WebChat gives us the nested activity. Determine
  // if we should be targeting the nested activity
  // within the selected activity.
  if (selectedActivity && selectedActivity.valueType === ValueTypes.Activity) {
    selectedActivity = selectedActivity.value;
  }
  const highlightedActivities = getActivityTargets([...highlightedObjects, selectedActivity]);

  return {
    highlightedActivities,
  };
}

export const TraceActivityContainer = connect(
  mapStateToProps,
  undefined
)(TraceActivity);
