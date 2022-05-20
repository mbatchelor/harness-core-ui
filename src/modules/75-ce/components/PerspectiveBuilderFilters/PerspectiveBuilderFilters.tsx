/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FieldArray } from 'formik'
import cx from 'classnames'
import { Color, FontVariation, Container, Text } from '@harness/uicore'
import type { ViewCondition } from 'services/ce/'
import type { QlceViewFieldIdentifierData } from 'services/ce/services'
import type { TimeRangeFilterType } from '@ce/types'
import { useStrings } from 'framework/strings'
import PerspectiveBuilderFilter, { PillData } from './PerspectiveBuilderFilter'
import css from './PerspectiveBuilderFilters.module.scss'

interface FiltersProps {
  index: number
  removePill?: (id: number) => void
  showAndOperator?: boolean
  fieldValuesList: QlceViewFieldIdentifierData[]
  removeEntireRow: () => void
  filterValue: ViewCondition[] | undefined
  setFieldValue: (id: number, data: Omit<PillData, 'type'>) => void
  timeRange: TimeRangeFilterType
  fieldName: string
}

const Filters: React.FC<FiltersProps> = ({
  removePill,
  fieldValuesList,
  removeEntireRow,
  filterValue,
  setFieldValue,
  timeRange,
  fieldName,
  showAndOperator
}) => {
  const { getString } = useStrings()
  const onPillDataChange: (id: number, data: Omit<PillData, 'type'>) => void = (id, data) => {
    if (data.viewField.identifier === 'CUSTOM') {
      data.values = []
    }
    setFieldValue(id, data)
  }

  return (
    <FieldArray
      name={fieldName}
      render={arrayHelpers => {
        const filters = (filterValue || []) as unknown as PillData[]
        return (
          <section className={cx(css.filterContainer)}>
            {filters.map((data, innerIndex) => {
              return (
                <Container
                  className={cx(
                    css.filters,
                    { [css.withAndOperation]: showAndOperator },
                    { [css.bottomPadding]: filters.length > 1 }
                  )}
                  key={`filter-pill-${innerIndex}`}
                >
                  <PerspectiveBuilderFilter
                    timeRange={timeRange}
                    showAddButton={innerIndex === filters.length - 1}
                    onButtonClick={() => {
                      arrayHelpers.push({
                        type: 'VIEW_ID_CONDITION',
                        viewField: {
                          fieldId: '',
                          fieldName: '',
                          identifier: '',
                          identifierName: ''
                        },
                        viewOperator: 'IN',
                        values: []
                      })
                    }}
                    key={`filter-pill-${innerIndex}`}
                    id={innerIndex}
                    removePill={() => {
                      if (filters.length === 1) {
                        removeEntireRow()
                        return
                      }
                      arrayHelpers.remove(innerIndex)
                      removePill && removePill(innerIndex)
                    }}
                    fieldValuesList={fieldValuesList}
                    onChange={onPillDataChange}
                    pillData={data}
                  />
                  {showAndOperator && innerIndex === filters.length - 1 ? (
                    <Text
                      padding={{
                        bottom: 'small'
                      }}
                      font={{
                        variation: FontVariation.BODY2
                      }}
                      color={Color.PRIMARY_7}
                      inline
                      className={css.andOperator}
                    >
                      {getString('ce.common.and')}
                    </Text>
                  ) : null}
                </Container>
              )
            })}
          </section>
        )
      }}
    />
  )
}

export default Filters
