/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { ReactElement, ReactNode } from 'react'
import { render, RenderResult, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Formik } from '@wings-software/uicore'
import type { FormikProps } from 'formik'
import { TestWrapper } from '@common/utils/testUtils'
import type { Feature, FeatureState, ServingRule } from 'services/cf'
import type { FlagActivationFormValues } from '@cf/components/FlagActivation/FlagActivation'
import TabTargeting, { TabTargetingProps } from '../TabTargeting'
import mockFeatureData from './mockFeature'

const mockFeature: Feature = mockFeatureData as Feature

jest.mock('@cf/hooks/useTargetAttributes', () => ({
  useTargetAttributes: jest.fn().mockReturnValue({ loading: false, targetAttributes: ['attrib1', 'attrib2'] }),
  TargetAttributesProvider: ({ children }: { children: ReactNode }) => children
}))

const mockRule: ServingRule = {
  ruleId: 'testRule',
  clauses: [{ id: 'clause1', op: 'segmentMatch', attribute: '', values: ['targetGroup1'], negate: false }],
  priority: 100,
  serve: {
    distribution: {
      bucketBy: 'identifier',
      variations: [
        { variation: 'true', weight: 50 },
        { variation: 'false', weight: 50 }
      ]
    }
  }
}

const renderComponent = (props: Partial<TabTargetingProps> = {}): RenderResult =>
  render(
    <TabTargeting
      feature={mockFeature}
      formikProps={{} as FormikProps<FlagActivationFormValues>}
      editing={false}
      setEditing={jest.fn}
      environmentIdentifier="qa"
      projectIdentifier="Kevin_Test"
      orgIdentifier="harness"
      accountIdentifier="px7xd_BFRCi-pfWPYXVjvw"
      {...props}
    />,
    {
      wrapper: ({ children }) => (
        <TestWrapper>
          <Formik
            onSubmit={jest.fn()}
            formName="test"
            initialValues={{
              defaultServe: props.feature?.envProperties?.defaultServe || mockFeature.envProperties?.defaultServe,
              offVariation: props?.feature?.envProperties?.offVariation || mockFeature.envProperties?.offVariation,
              state: props?.feature?.envProperties?.state || mockFeature.envProperties?.state,
              customRules: props.feature?.envProperties?.rules || mockFeature.envProperties?.rules,
              variationMap: props.feature?.envProperties?.variationMap || mockFeature.envProperties?.variationMap
            }}
          >
            {formikProps =>
              React.Children.map(children, child => React.cloneElement(child as ReactElement, { formikProps }))
            }
          </Formik>
        </TestWrapper>
      )
    }
  )

describe('TabTargeting', () => {
  test.each([
    ['Off', 'On'],
    ['On', 'Off']
  ])(
    'it should show a message stating that the flag will be turned %s upon save when the feature is %s and the status switch is clicked',
    async (target, current) => {
      // @ts-ignore
      const envProperties: Feature['envProperties'] = {
        ...mockFeature.envProperties,
        state: current.toLowerCase() as FeatureState
      }

      renderComponent({ feature: { ...mockFeature, envProperties } })

      const switchEl = screen.getByRole('checkbox')
      expect(switchEl).toBeInTheDocument()
      expect(screen.getByText(`cf.featureFlags.flag${current}`)).toBeInTheDocument()
      expect(screen.queryByText(`cf.featureFlags.flagWillTurn${target}`)).not.toBeInTheDocument()

      userEvent.click(switchEl)

      expect(screen.getByText(`cf.featureFlags.flagWillTurn${target}`)).toBeInTheDocument()
      expect(screen.queryByText(`cf.featureFlags.flag${current}`)).not.toBeInTheDocument()
    }
  )

  test('it should enable editing mode when the Edit button is clicked', async () => {
    const setEditing = jest.fn()

    renderComponent({ setEditing })

    const editButton = screen.getByRole('button', { name: 'edit cf.featureFlags.rules.editRules' })
    expect(editButton).toBeInTheDocument()
    expect(setEditing).not.toHaveBeenCalled()

    userEvent.click(editButton)
    expect(setEditing).toHaveBeenCalledWith(true)
  })

  test('it should display the Default Rules section', async () => {
    renderComponent()

    expect(screen.getByText('cf.featureFlags.rules.defaultRules')).toBeInTheDocument()
    expect(screen.queryByText('cf.featureFlags.rules.customRules')).not.toBeInTheDocument()
  })

  test('it should display the Custom Rules section when in editing mode', async () => {
    renderComponent({ editing: true })

    expect(screen.getByText('cf.featureFlags.rules.customRules')).toBeInTheDocument()
  })

  test('it should display the Custom Rules section the feature has custom rules', async () => {
    // @ts-ignore
    const envProperties: Feature['envProperties'] = {
      ...mockFeature.envProperties,
      rules: [mockRule]
    }

    renderComponent({ feature: { ...mockFeature, envProperties } })

    expect(screen.getByText('cf.featureFlags.rules.customRules')).toBeInTheDocument()
  })
})
