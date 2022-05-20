/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { TextInput } from '@wings-software/uicore'
import { Popover, PopoverInteractionKind, Position, TagInput } from '@blueprintjs/core'
import { debounce } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { QlceViewFilterOperator, Maybe } from 'services/ce/services'
import PerspectiveBuilderMultiValueSelector from '@ce/components/MultiValueSelectorComponent/PerspectiveBuilderMultiValueSelector'
import type { ProviderType } from '../PerspectiveBuilderFilter'

import css from '../PerspectiveBuilderFilter.module.scss'

interface ValuesSelectorProps {
  isDisabled: boolean
  provider: ProviderType | null | undefined
  service: ProviderType | null | undefined
  operator: QlceViewFilterOperator
  valueList: Maybe<string>[]
  fetching: boolean
  selectedVal: string[]
  onValueChange: (val: string[]) => void
  fetchMore?: (e: number) => void
  shouldFetchMore?: boolean
  onInputChange: (val: string) => void
  searchText: string
}

const ValuesSelector: React.FC<ValuesSelectorProps> = ({
  isDisabled,
  fetching,
  valueList,
  selectedVal,
  onValueChange,
  fetchMore,
  shouldFetchMore,
  onInputChange,
  searchText,
  operator
}) => {
  const [selectedValues, setSelectedValues] = useState<Record<string, boolean>>({})

  const { getString } = useStrings()

  const debouncedInputChange = useCallback(debounce(onInputChange, 500), [])

  useEffect(() => {
    const newSelectedVals: Record<string, boolean> = {}
    selectedVal?.forEach(val => {
      if (val) {
        newSelectedVals[val] = true
      }
    })
    setSelectedValues(newSelectedVals)
  }, [selectedVal])

  const handleAddNewTag = (values: string[]): void => {
    const customValues = Object.assign(
      {},
      ...values.map(value => ({
        [value]: !selectedValues[value]
      }))
    )
    onValueChange(
      Object.keys({ ...selectedValues, ...customValues }).filter(val => selectedValues[val] || customValues[val])
    )
    setSelectedValues(prevVal => ({
      ...prevVal,
      ...customValues
    }))
    debouncedInputChange('')
  }

  const handleRemoveTag = (value: string): void => {
    onValueChange(Object.keys(selectedValues).filter(val => val !== value))
    setSelectedValues(prevVal => ({
      ...prevVal,
      [value]: !selectedValues[value]
    }))
  }

  return operator === QlceViewFilterOperator.Like ? (
    <TextInput
      wrapperClassName={css.conditionInputWrapper}
      className={css.conditionInput}
      placeholder={getString('ce.perspectives.createPerspective.filters.enterCondition')}
      defaultValue={selectedVal[0]}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange([e.target.value])
      }}
    />
  ) : (
    <Popover
      autoFocus={false}
      disabled={isDisabled}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM_LEFT}
      modifiers={{
        arrow: { enabled: false },
        flip: { enabled: true },
        keepTogether: { enabled: true },
        preventOverflow: { enabled: true }
      }}
      onClosing={() => {
        onValueChange(Object.keys(selectedValues).filter(val => selectedValues[val]))
      }}
      fill={true}
      usePortal={true}
      content={
        <PerspectiveBuilderMultiValueSelector
          fetching={fetching}
          valueList={valueList}
          shouldFetchMore={shouldFetchMore}
          setSelectedValues={setSelectedValues}
          selectedValues={selectedValues}
          fetchMore={fetchMore}
          searchText={searchText}
          createNewTag={handleAddNewTag}
        />
      }
    >
      <TagInput
        values={selectedVal}
        placeholder={getString('ce.perspectives.createPerspective.filters.selectValues')}
        onAdd={handleAddNewTag}
        onRemove={handleRemoveTag}
        onInputChange={e => debouncedInputChange((e.target as HTMLInputElement).value)}
        className={css.tagInput}
        disabled={isDisabled}
        tagProps={{ className: css.valueTag, onClick: e => e.stopPropagation() }}
      />
    </Popover>
  )
}

export default ValuesSelector
