/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { useParams } from 'react-router-dom'
import { Button, Container, Layout, Text } from '@harness/uicore'
import { FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useGetTags } from '@dashboards/services/CustomDashboardsService'
import css from './HomePage.module.scss'
import moduleTagCss from '@dashboards/common/ModuleTags.module.scss'

export interface FilterTagsSideBarProps {
  setFilteredTags: (cb: (prevState: string[]) => string[]) => void
}

const FilterTagsSideBar: React.FC<FilterTagsSideBarProps> = ({ setFilteredTags }) => {
  const { getString } = useStrings()
  const { accountId, folderId } = useParams<{ accountId: string; folderId: string }>()

  const { data: tagsList, loading: fetchingTags } = useGetTags(accountId, folderId)

  return (
    <Layout.Vertical className={css.filterPanel} padding="medium" spacing="medium">
      <Text font={{ variation: FontVariation.FORM_SUB_SECTION }}>{getString('dashboards.homePage.filterByTags')}</Text>
      <Container className={moduleTagCss.predefinedTags}>
        {fetchingTags && <span>{getString('loading')} </span>}
        {!fetchingTags &&
          tagsList?.resource?.tags
            ?.split(',')
            .filter((tag: string) => !!tag)
            .map((tag: string, index: number) => {
              return (
                <Button
                  text={tag}
                  inline
                  minimal
                  className={cx(moduleTagCss.customTag, moduleTagCss.customTagButton)}
                  key={tag + index}
                  onClick={() => {
                    setFilteredTags(prevState => {
                      if (!prevState.includes(tag)) {
                        return [...prevState, tag]
                      }
                      return prevState
                    })
                  }}
                />
              )
            })}

        {tagsList?.resource?.tags?.length === 0 && <span>{getString('dashboards.homePage.noTags')}</span>}
      </Container>
    </Layout.Vertical>
  )
}

export default FilterTagsSideBar
