/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { omit } from 'lodash-es'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import type { UpdatedHealthSource } from '../../HealthSourceDrawer/HealthSourceDrawerContent.types'
import { SplunkQueryBuilder } from './components/MapQueriesToHarnessService/SplunkQueryBuilder'
import { buildSplunkHealthSourceInfo, createSplunkHealthSourcePayload } from './SplunkHealthSource.utils'
import type { SplunkHealthSourceInfo } from './SplunkHealthSource.types'

interface SplunkMonitoringSourceProps {
  data: any
  onSubmit: (formdata: SplunkHealthSourceInfo, UpdatedHealthSource: UpdatedHealthSource) => Promise<void>
  isTemplate?: boolean
  expressions?: string[]
}

export default function SplunkHealthSource(props: SplunkMonitoringSourceProps): JSX.Element {
  const { data: sourceData, onSubmit, isTemplate, expressions } = props
  const allParams = useParams<ProjectPathProps & { identifier: string }>()
  const { onPrevious } = useContext(SetupSourceTabsContext)
  const requiredParams = omit(allParams, 'identifier')

  const handleOnSubmit = useCallback(
    async (splunkFormData: SplunkHealthSourceInfo) => {
      const splunkHealthSourcePayload = createSplunkHealthSourcePayload(splunkFormData)
      await onSubmit(sourceData, splunkHealthSourcePayload)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceData]
  )

  return (
    <SplunkQueryBuilder
      data={buildSplunkHealthSourceInfo(requiredParams, sourceData)}
      onSubmit={handleOnSubmit}
      onPrevious={() => onPrevious(sourceData)}
      isTemplate={isTemplate}
      expressions={expressions}
    />
  )
}
