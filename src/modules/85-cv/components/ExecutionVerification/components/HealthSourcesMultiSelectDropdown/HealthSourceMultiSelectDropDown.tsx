/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useCallback } from 'react'
import { MultiSelectDropDown, MultiSelectOption, SelectOption } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { getDropdownOptions } from '@cv/components/HealthSourceDropDown/HealthSourceDropDown.utils'
import { VerificationType } from '@cv/components/HealthSourceDropDown/HealthSourceDropDown.constants'
import type { HealthSourceMultiSelectDropDownProps } from './HealthSourceMultiSelectDropDown.types'

export function HealthSourceMultiSelectDropDown(props: HealthSourceMultiSelectDropDownProps): JSX.Element {
  const {
    onChange,
    verificationType = VerificationType.TIME_SERIES,
    data,
    error,
    loading,
    selectedValues,
    className
  } = props
  const { getString } = useStrings()

  const healthSources: SelectOption[] = useMemo(() => {
    return getDropdownOptions({ loading, error, data, verificationType }, getString, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error, loading, verificationType])

  const getFilteredText = useCallback(
    (selectedOptions: MultiSelectOption[] = [], filterText = ' '): string => {
      const baseText = getString(filterText)

      if (loading) {
        return `${getString(filterText)} ${getString('loading')}`
      }
      return `${baseText}: ${selectedOptions?.length > 0 ? '' : getString('all')}`
    },
    [getString, loading]
  )

  return (
    <MultiSelectDropDown
      placeholder={getFilteredText(selectedValues, 'pipeline.verification.healthSourceLabel')}
      value={selectedValues}
      className={className}
      items={healthSources}
      onChange={onChange}
      buttonTestId={'HealthSource_MultiSelect_DropDown'}
    />
  )
}
