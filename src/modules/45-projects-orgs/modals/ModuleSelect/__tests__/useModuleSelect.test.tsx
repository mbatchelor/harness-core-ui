import React from 'react'
import { act, fireEvent, render, getByText as getByTxt, waitFor } from '@testing-library/react'
import { Button } from '@harness/uicore'
import noop from 'lodash-es/noop'
import mockImport from 'framework/utils/mockImport'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import * as featureFlags from '@common/hooks/useFeatureFlag'
import { useModuleSelectModal } from '../useModuleSelect'

jest.spyOn(featureFlags, 'useFeatureFlags').mockImplementation(() => ({
  CDNG_ENABLED: true,
  CVNG_ENABLED: true,
  CING_ENABLED: true,
  CENG_ENABLED: true,
  CFNG_ENABLED: true
}))
const TestComponent: React.FC = () => {
  const { openModuleSelectModal } = useModuleSelectModal({ onCloseModal: noop, onSuccess: noop })

  return (
    <Button
      text="click here"
      onClick={() => {
        openModuleSelectModal({
          identifier: 'project1',
          modules: ['CD'],
          name: 'Project 1'
        })
      }}
    />
  )
}
describe('module select test', () => {
  test('free trial btn ', async () => {
    const { getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <TestComponent />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(getByText('click here'))
    })
    const dialog = findDialogContainer()
    expect(dialog).toBeTruthy()
    await waitFor(() => {
      if (dialog) {
        fireEvent.click(getByTxt(dialog, 'common.purpose.cd.continuous'))
      }
    })

    expect(dialog).toMatchSnapshot()
  })
  test('free plan btn ', async () => {
    jest.spyOn(featureFlags, 'useFeatureFlags').mockImplementation(() => ({
      CDNG_ENABLED: true,
      CVNG_ENABLED: true,
      CING_ENABLED: true,
      CENG_ENABLED: true,
      CFNG_ENABLED: true,
      FREE_PLAN_ENABLED: true
    }))
    const { getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <TestComponent />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(getByText('click here'))
    })
    const dialog = findDialogContainer()
    expect(dialog).toBeTruthy()
    await waitFor(() => {
      if (dialog) {
        fireEvent.click(getByTxt(dialog, 'common.purpose.cd.continuous'))
      }
    })

    expect(dialog).toMatchSnapshot()
  })

  test('go to Module  btn ', async () => {
    mockImport('framework/LicenseStore/LicenseStoreContext', {
      useLicenseStore: jest.fn().mockImplementation(() => ({
        licenseInformation: { CD: {} }
      }))
    })
    const { getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <TestComponent />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(getByText('click here'))
    })
    const dialog = findDialogContainer()
    expect(dialog).toBeTruthy()
    await waitFor(() => {
      if (dialog) {
        fireEvent.click(getByTxt(dialog, 'common.purpose.cd.continuous'))
      }
    })

    expect(dialog).toMatchSnapshot()
  })
  test('test on prem getting directly continue btn ', async () => {
    mockImport('framework/LicenseStore/LicenseStoreContext', {
      useLicenseStore: jest.fn().mockImplementation(() => ({
        licenseInformation: { CD: {} }
      }))
    })
    mockImport('@common/utils/utils', {
      isOnPrem: jest.fn().mockImplementation(() => true)
    })
    const { getByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <TestComponent />
      </TestWrapper>
    )
    act(() => {
      fireEvent.click(getByText('click here'))
    })
    const dialog = findDialogContainer()
    expect(dialog).toBeTruthy()
    await waitFor(() => {
      if (dialog) {
        fireEvent.click(getByTxt(dialog, 'common.purpose.cd.continuous'))
      }
    })

    expect(dialog).toMatchSnapshot()
  })
})
