/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useParams } from 'react-router-dom'
import { useGet } from 'restful-react'
import type { GetState } from 'restful-react/dist/Get'
import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'

export interface ErrorResponse {
  message: string
  status: number
  data: {
    message: string
  }
}

export interface IssueCounts {
  critical: number
  high: number
  medium: number
  low: number
  info: number
  unassigned: number
}

export function useIssueCounts(pipelineId: string, executionId: string): GetState<IssueCounts, ErrorResponse> {
  const { projectIdentifier: projectId, orgIdentifier: orgId, accountId } = useParams<PipelinePathProps>()

  return useGet<IssueCounts, ErrorResponse>({
    path: '/sto/api/v1/issue-counts',
    queryParams: {
      accountId,
      orgId,
      projectId,
      pipelineId,
      executionId
    }
  })
}
