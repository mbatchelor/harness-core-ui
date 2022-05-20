/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import moment from 'moment'
import { Color } from '@harness/design-system'
import type { EventData } from '@cv/components/ActivitiesTimelineView/ActivitiesTimelineView'
import type { ChangeEventMetadata, ChangeEventDTO } from 'services/cv'
import type { UseStringsReturn } from 'framework/strings'
import type { CustomChangeEventDTO } from './ChangeEventCard.types'
import { VerificationStatus } from './ChangeEventCard.constant'

export const createChangeDetailsData = (resource: ChangeEventDTO | undefined) => {
  const { type, category, serviceName = '', environmentName = '', metadata } = resource || {}
  return {
    type,
    category,
    status: metadata?.status,
    details: {
      service: { name: serviceName },
      environment: { name: environmentName },
      source: { name: type, url: metadata?.htmlUrl }
    }
  }
}

export const createChangeInfoData = (metadata: ChangeEventMetadata | undefined) => {
  const {
    triggeredAt = 0,
    priority,
    urgency,
    assignment,
    assignmentUrl,
    escalationPolicy,
    escalationPolicyUrl
  } = metadata || {}
  return {
    triggerAt: moment(new Date(triggeredAt * 1000)).format('Do MMM hh:mm A'),
    summary: {
      priority: priority,
      assignee: { name: assignment, url: assignmentUrl },
      urgency: urgency,
      policy: { name: escalationPolicy, url: escalationPolicyUrl }
    }
  }
}

export const createChangeTitleData = (resource: CustomChangeEventDTO | undefined) => {
  const { name, id = '', type, metadata, serviceIdentifier, envIdentifier } = resource || {}
  return {
    name,
    type,
    executionId: id,
    url: metadata?.pipelinePath,
    serviceIdentifier,
    envIdentifier,
    status: metadata?.status
  }
}

export function verificationResultToColor(
  verificationResult: EventData['verificationResult'],
  getString: UseStringsReturn['getString']
): {
  color: Color
  statusMessage: string
  backgroundColor: Color
} {
  let statusMessage = ''
  let color = Color.GREY_700
  let backgroundColor = Color.GREY_350
  switch (verificationResult) {
    case VerificationStatus.IN_PROGRESS:
      statusMessage = getString('inProgress')
      color = Color.PRIMARY_2
      backgroundColor = Color.PRIMARY_6
      break
    case VerificationStatus.VERIFICATION_FAILED:
      statusMessage = getString('failed')
      color = Color.RED_500
      backgroundColor = Color.RED_200
      break
    case VerificationStatus.ERROR:
      statusMessage = getString('error')
      color = Color.RED_500
      backgroundColor = Color.RED_200
      break
    case VerificationStatus.VERIFICATION_PASSED:
      statusMessage = getString('passed')
      color = Color.GREEN_700
      backgroundColor = Color.GREEN_350
      break
    default:
  }

  return {
    statusMessage,
    color,
    backgroundColor
  }
}
