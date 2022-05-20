/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color } from '@harness/design-system'
import type { ChangeEventDTO } from 'services/cv'
import { ChangeSourceTypes } from '@cv/pages/ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer.constants'
import { VerificationStatus } from '../ChangeEventCard.constant'
import type { CustomChangeEventDTO } from '../ChangeEventCard.types'
import {
  createChangeDetailsData,
  createChangeInfoData,
  createChangeTitleData,
  verificationResultToColor
} from '../ChangeEventCard.utils'
import {
  EXECUTION_STATUS_HARNESS_CD_NEXTGEN,
  EXECUTION_STATUS_HARNESS_CD
} from '../components/ChangeDetails/ChangeDetails.constant'
import { statusToColorMapping } from '../components/ChangeDetails/ChangeDetails.utils'
import { payload } from './ChangeEventCard.mock'

describe('Validate Utils', () => {
  test('should createChangeDetailsData', () => {
    expect(createChangeDetailsData(payload.resource as ChangeEventDTO)).toEqual({
      category: 'Alert',
      details: {
        environment: {
          name: 'prod'
        },
        service: {
          name: 'service1'
        },
        source: { name: 'PagerDuty', url: 'https://acme.pagerduty.com/incidents/PGR0VU2' }
      },
      status: 'triggered',
      type: 'PagerDuty'
    })
  })

  test('should createChangeDetailsData', () => {
    expect(createChangeInfoData(payload.resource.metadata)).toEqual({
      summary: {
        assignee: { name: null, url: null },
        policy: { name: 'Default', url: 'https://acme.pagerduty.com/escalation_policies/PUS0KTE' },
        priority: 'P2',
        urgency: 'high'
      },
      triggerAt: '2nd Oct 06:45 PM'
    })
  })

  test('should createChangeDetailsData', () => {
    expect(createChangeTitleData(payload.resource as CustomChangeEventDTO | undefined)).toEqual({
      executionId: 'rZc13AsoT1CZigLguBXZaw',
      name: 'A little bump in the road',
      type: 'PagerDuty',
      //type: 'HarnessCDNextGen',
      serviceIdentifier: 'service1',
      envIdentifier: 'prod',
      status: 'triggered'
    })
  })

  test('should verificationResultToColor', () => {
    expect(verificationResultToColor(VerificationStatus.VERIFICATION_PASSED, (str: string) => str)).toEqual({
      backgroundColor: 'green350',
      color: 'green700',
      statusMessage: 'passed'
    })
    expect(verificationResultToColor(VerificationStatus.VERIFICATION_FAILED, (str: string) => str)).toEqual({
      backgroundColor: 'red200',
      color: 'red500',
      statusMessage: 'failed'
    })
    expect(verificationResultToColor(VerificationStatus.IN_PROGRESS, (str: string) => str)).toEqual({
      backgroundColor: 'primary6',
      color: 'primary2',
      statusMessage: 'inProgress'
    })
    expect(verificationResultToColor(VerificationStatus.ERROR, (str: string) => str)).toEqual({
      backgroundColor: 'red200',
      color: 'red500',
      statusMessage: 'error'
    })
    expect(verificationResultToColor(VerificationStatus.ABORTED, (str: string) => str)).toEqual({
      backgroundColor: 'grey350',
      color: 'grey700',
      statusMessage: ''
    })
    expect(verificationResultToColor(VerificationStatus.NOT_STARTED, (str: string) => str)).toEqual({
      backgroundColor: 'grey350',
      color: 'grey700',
      statusMessage: ''
    })
    expect(verificationResultToColor(VerificationStatus.IGNORED, (str: string) => str)).toEqual({
      backgroundColor: 'grey350',
      color: 'grey700',
      statusMessage: ''
    })
  })

  test('should validate statusToColorMapping for HarnessCDNextGen', () => {
    expect(
      statusToColorMapping(EXECUTION_STATUS_HARNESS_CD_NEXTGEN.ABORTED, ChangeSourceTypes.HarnessCDNextGen)
    ).toEqual({
      color: Color.GREY_800,
      backgroundColor: Color.WHITE
    })
    expect(
      statusToColorMapping(EXECUTION_STATUS_HARNESS_CD_NEXTGEN.SUCCESS, ChangeSourceTypes.HarnessCDNextGen)
    ).toEqual({
      color: Color.GREEN_600,
      backgroundColor: Color.GREEN_100
    })
    expect(
      statusToColorMapping(EXECUTION_STATUS_HARNESS_CD_NEXTGEN.RUNNING, ChangeSourceTypes.HarnessCDNextGen)
    ).toEqual({
      color: Color.PRIMARY_7,
      backgroundColor: Color.BLUE_100
    })
    expect(
      statusToColorMapping(EXECUTION_STATUS_HARNESS_CD_NEXTGEN.PAUSING, ChangeSourceTypes.HarnessCDNextGen)
    ).toEqual({
      color: Color.ORANGE_500,
      backgroundColor: Color.ORANGE_100
    })
  })

  test('should validate statusToColorMapping for HarnessCD', () => {
    expect(statusToColorMapping(EXECUTION_STATUS_HARNESS_CD.ABORTED, ChangeSourceTypes.HarnessCD)).toEqual({
      color: Color.GREY_800,
      backgroundColor: Color.WHITE
    })
    expect(statusToColorMapping(EXECUTION_STATUS_HARNESS_CD.SUCCESS, ChangeSourceTypes.HarnessCD)).toEqual({
      color: Color.GREEN_600,
      backgroundColor: Color.GREEN_100
    })
    expect(statusToColorMapping(EXECUTION_STATUS_HARNESS_CD.RUNNING, ChangeSourceTypes.HarnessCD)).toEqual({
      color: Color.PRIMARY_7,
      backgroundColor: Color.BLUE_100
    })
    expect(statusToColorMapping(EXECUTION_STATUS_HARNESS_CD.PAUSING, ChangeSourceTypes.HarnessCD)).toEqual({
      color: Color.ORANGE_500,
      backgroundColor: Color.ORANGE_100
    })
  })
})
