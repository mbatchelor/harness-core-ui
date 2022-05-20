/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render, RenderResult, screen, waitFor, within } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { TestWrapper } from '@common/utils/testUtils'
import { FolderType } from '@dashboards/constants/FolderType'
import { useStrings } from 'framework/strings'
import type { FolderModel } from 'services/custom-dashboards'
import FolderCard, { FolderCardProps } from '../FolderCard'

const testFolder: FolderModel = {
  id: '1',
  name: 'testName',
  title: 'testTitle',
  type: FolderType.ACCOUNT,
  child_count: 0,
  created_at: '01/01/2022'
}

const defaultProps: FolderCardProps = {
  accountId: '1',
  folder: testFolder,
  onTriggerFolderRefetch: jest.fn()
}

const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
  <TestWrapper>{children}</TestWrapper>
)

const { result } = renderHook(() => useStrings(), { wrapper })

const renderComponent = (props: FolderCardProps): RenderResult => {
  return render(
    <TestWrapper>
      <FolderCard {...props} />
    </TestWrapper>
  )
}

const openContextMenu = async (element: HTMLElement): Promise<void> => {
  const folderCard = element.querySelector('.card')!
  const button = within(folderCard as HTMLElement).getByRole(`button`)!

  act(() => {
    fireEvent.click(button)
  })
}

describe('FolderCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('it should display a Folder Card with a name displayed', async () => {
    renderComponent(defaultProps)

    await waitFor(() => expect(screen.getByText(testFolder.name)).toBeInTheDocument())
    const folderChildCount = screen.getByTestId('folder-child-count')
    expect(folderChildCount.textContent).toBe(testFolder.child_count.toString())
  })

  test('it should show a context menu when clicking the menu button', async () => {
    const { container } = renderComponent(defaultProps)

    await openContextMenu(container)

    expect(screen.getByText(result.current.getString('delete'))).toBeInTheDocument()
  })

  test('it should show confirmation dialog when Delete is clicked', async () => {
    const { container } = renderComponent(defaultProps)

    await openContextMenu(container)

    act(() => {
      fireEvent.click(screen.getByText(result.current.getString('delete')))
    })
    const confirmationButton = screen.getByText(
      result.current.getString('dashboards.deleteFolder.confirmDeleteTitle', { name: testFolder.name })
    )
    expect(confirmationButton).toBeInTheDocument()
  })
})
