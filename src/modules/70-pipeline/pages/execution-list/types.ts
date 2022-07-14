/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { GetListOfExecutionsQueryParams, PipelineExecutionFilterProperties } from 'services/pipeline-ng'

export type StringQueryParams = Partial<Record<keyof GetListOfExecutionsQueryParams, string>> & {
  filters?: string
  getDefaultFromOtherRepo?: boolean
}

export type QueryParams = Partial<GetListOfExecutionsQueryParams> & {
  filters?: PipelineExecutionFilterProperties
}

export type QuickStatusParam = GetListOfExecutionsQueryParams['status']
