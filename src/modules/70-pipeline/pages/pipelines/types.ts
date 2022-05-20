/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export interface PipelineListQueryParams {
  page?: number
  size?: number
  sort?: string
  searchTerm?: string
  module?: string
  filterIdentifier?: string
  branch?: string
  repoIdentifier?: string
  getDefaultFromOtherRepo?: boolean
  getDistinctFromBranches?: boolean
}

export type StringQueryParams = Partial<Record<keyof PipelineListQueryParams, string>> & {
  filters?: string
  getDefaultFromOtherRepo?: boolean
}

export type QueryParams = Partial<PipelineListQueryParams> & {
  filters?: PipelineListQueryParams
}
