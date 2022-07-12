/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { act } from '@testing-library/react-hooks'
import { Formik, FormikForm } from '@harness/uicore'
import { defaultTo, noop } from 'lodash-es'
import { FieldArray } from 'formik'
import { TestWrapper } from '@common/utils/testUtils'
import NotificationMethod from '../NotificationMethod'

const params = {
  accountId: 'TEST_ACC'
}

const props: any = {
  name: '',
  onClose: jest.fn(),
  previousStep: jest.fn(),
  nextStep: jest.fn(),
  formikProps: {
    values: {
      alertList: [
        {
          channelName: 'EMAIL',
          channelUrl: 'harness.harness.io'
        },
        {
          channelName: 'SLACK',
          channelUrl: 'https://hooks.slack.com/services/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'
        }
      ]
    },
    setFieldValue: jest.fn()
  }
}

describe('Test case for Anomalies alert notification method selection', () => {
  test('Should be able to load alert method selection screen', async () => {
    const notificationList = defaultTo(props.formikProps?.values?.alertList, [])
    const { container } = render(
      <TestWrapper pathParams={params}>
        <FieldArray
          {...props}
          render={() => {
            return (
              <div>
                {notificationList.map((item: any, index: number) => (
                  <input key={index} type="text" name={item.channelUrl} />
                ))}
              </div>
            )
          }}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('Should be able to add new channel', async () => {
    const { container, getByText, findByTestId } = render(
      <TestWrapper pathParams={params}>
        <Formik onSubmit={noop} formName={''} initialValues={{}}>
          <FormikForm>
            <NotificationMethod {...props} />
          </FormikForm>
        </Formik>
      </TestWrapper>
    )

    const addChannelBtn = getByText('ce.anomalyDetection.notificationAlerts.addChannelBtn')
    expect(addChannelBtn).toBeTruthy()
    act(() => {
      fireEvent.click(addChannelBtn)
    })
    await waitFor(() => expect(findByTestId('notification-channel')).toBeTruthy())

    expect(container).toMatchSnapshot()
  })

  test('Should be able to render 1st screen on back click', async () => {
    const { container, getAllByText } = render(
      <TestWrapper pathParams={params}>
        <NotificationMethod {...props} />
      </TestWrapper>
    )

    const backBtn = getAllByText('back')[0]
    expect(backBtn).toBeDefined()
    act(() => {
      fireEvent.click(backBtn!)
    })

    await waitFor(() => {
      expect(props.previousStep).toBeCalledWith({ name: props.name })
    })

    expect(container).toMatchSnapshot()
  })

  test('Should be able to delete row on delete icon click', async () => {
    const { container, getByTestId } = render(
      <TestWrapper pathParams={params}>
        <Formik onSubmit={noop} formName={''} initialValues={{}}>
          <FormikForm>
            <NotificationMethod {...props} />
          </FormikForm>
        </Formik>
      </TestWrapper>
    )

    const deleteIcon = container.querySelector('[data-testid="deleteChannel"]')
    expect(deleteIcon).toBeDefined()
    act(() => {
      fireEvent.click(deleteIcon!)
    })
    expect(() => getByTestId('notification-channel')).toThrow()
    expect(container).toMatchSnapshot()
  })

  test('Should be able to close the modal on click of close button', async () => {
    const { container } = render(
      <TestWrapper pathParams={params}>
        <NotificationMethod {...props} />
      </TestWrapper>
    )

    const crossIcon = container.querySelector('[data-testid="crossModal"]')
    expect(crossIcon).toBeDefined()
    act(() => {
      fireEvent.click(crossIcon!)
    })

    await waitFor(() => {
      expect(props.onClose).toBeCalled()
    })
  })

  test('should be able to submit the form', async () => {
    const { getByText } = render(
      <TestWrapper pathParams={params}>
        <NotificationMethod {...props} />
      </TestWrapper>
    )

    const continueBtn = getByText('saveAndContinue')
    expect(continueBtn).toBeDefined()
    act(() => {
      fireEvent.click(continueBtn!)
    })

    await waitFor(() => {
      expect(props.nextStep).toBeCalledWith({ name: props.name })
    })
  })
})
