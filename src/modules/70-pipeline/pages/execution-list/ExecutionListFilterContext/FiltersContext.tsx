/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import type { FilterDTO } from 'services/pipeline-ng'
import type { QueryParams } from '../types'

export interface FiltersContextValues {
  savedFilters: FilterDTO[]
  isFetchingFilters: boolean
  refetchFilters(): Promise<void>
  queryParams: QueryParams
}

export const FiltersContext = React.createContext<FiltersContextValues>({
  savedFilters: [],
  isFetchingFilters: true,
  refetchFilters: () => Promise.resolve(),
  queryParams: {}
})

export interface FilterContextProviderProps extends FiltersContextValues {
  children: React.ReactNode
}

export function FilterContextProvider(props: FilterContextProviderProps): React.ReactElement {
  const { children, ...rest } = props

  return <FiltersContext.Provider value={rest}>{children}</FiltersContext.Provider>
}

export function useFiltersContext(): FiltersContextValues {
  return React.useContext(FiltersContext)
}
