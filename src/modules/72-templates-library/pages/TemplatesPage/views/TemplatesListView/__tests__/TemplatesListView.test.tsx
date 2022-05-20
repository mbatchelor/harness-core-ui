/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { noop, defaultTo, set } from 'lodash-es'
import produce from 'immer'
import { mockTemplates } from '@templates-library/TemplatesTestHelper'
import { TemplatesListView } from '@templates-library/pages/TemplatesPage/views/TemplatesListView/TemplatesListView'
import { TestWrapper } from '@common/utils/testUtils'
import type { TemplatesViewProps } from '@templates-library/pages/TemplatesPage/views/TemplatesView/TemplatesView'
import { gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'
import * as cdng from 'services/cd-ng'

jest.spyOn(cdng, 'useListGitSync').mockImplementation((): any => {
  return { data: gitConfigs, refetch: jest.fn(), loading: false }
})
jest.spyOn(cdng, 'useGetSourceCodeManagers').mockImplementation((): any => {
  return { data: sourceCodeManagers, refetch: jest.fn(), loading: false }
})

const baseProps: TemplatesViewProps = {
  data: defaultTo(mockTemplates.data, {}),
  gotoPage: jest.fn(),
  onSelect: jest.fn()
}

describe('<TemplatesListView /> tests', () => {
  test('should match snapshot without three dots', () => {
    const { container } = render(
      <TestWrapper>
        <TemplatesListView {...baseProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should match snapshot without three dots and a template is selected', () => {
    const { container } = render(
      <TestWrapper>
        <TemplatesListView {...baseProps} selectedTemplate={mockTemplates.data?.content?.[0]} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should match snapshot with three dots', () => {
    const { container } = render(
      <TestWrapper>
        <TemplatesListView {...baseProps} onPreview={noop} onOpenEdit={noop} onOpenSettings={noop} onDelete={noop} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should match snapshot without three dots when git sync is enabled', () => {
    const { container } = render(
      <TestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
        <TemplatesListView {...baseProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should match snapshot with three dots when git sync is enabled and invalid yaml', () => {
    const props = produce(baseProps, draft => {
      set(draft, 'data.content[0].entityValidityDetails.valid', false)
    })
    const { container } = render(
      <TestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
        <TemplatesListView {...props} onPreview={noop} onOpenEdit={noop} onOpenSettings={noop} onDelete={noop} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should call onSelect with correct when item is clicked', () => {
    const { container } = render(
      <TestWrapper>
        <TemplatesListView {...baseProps} />
      </TestWrapper>
    )
    const templateRows = container.querySelectorAll('.TableV2--body [role="row"]')
    expect(templateRows.length).toEqual(mockTemplates.data?.content?.length)
    act(() => {
      fireEvent.click(templateRows[0])
    })
    expect(baseProps.onSelect).toBeCalledWith(mockTemplates.data?.content?.[0])
  })
})
