/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, Text, StepProps, FormikForm, Formik, Container, Layout } from '@wings-software/uicore'
import * as Yup from 'yup'
import { Color } from '@harness/design-system'
import type { SecretDTOV2 } from 'services/cd-ng'
import { NameIdDescriptionTags } from '@common/components'
import { StringUtils } from '@common/exports'
import { useStrings } from 'framework/strings'
import type { WinRmCredSharedObj } from '../CreateWinRmCredWizard'
import css from './StepDetails.module.scss'

export type DetailsForm = Pick<SecretDTOV2, 'name' | 'identifier' | 'description' | 'tags'>

const StepWinRmDetails: React.FC<StepProps<WinRmCredSharedObj> & WinRmCredSharedObj> = ({
  prevStepData,
  nextStep,
  detailsData,
  authData,
  isEdit
}) => {
  const { getString } = useStrings()
  return (
    <Container padding="small" height={500}>
      <Text margin={{ bottom: 'xlarge' }} font={{ size: 'medium' }} color={Color.BLACK}>
        {getString('secrets.createWinRmCredWizard.titleDetails')}
      </Text>
      <Formik<DetailsForm>
        onSubmit={values => {
          nextStep?.({ detailsData: values, authData, isEdit: isEdit, ...prevStepData })
        }}
        formName="winRmStepDetailsForm"
        validationSchema={Yup.object().shape({
          name: Yup.string().trim().required(getString('secrets.createSSHCredWizard.validName')),
          identifier: Yup.string().when('name', {
            is: val => val?.length,
            then: Yup.string()
              .trim()
              .required(getString('secrets.createSSHCredWizard.validId'))
              .matches(/^(?![0-9])[0-9a-zA-Z_$]*$/, getString('secrets.createSSHCredWizard.validIdRegex'))
              .notOneOf(StringUtils.illegalIdentifiers)
          })
        })}
        initialValues={{
          name: '',
          identifier: '',
          description: '',
          tags: {},
          ...(prevStepData ? prevStepData.detailsData : detailsData)
        }}
      >
        {formikProps => {
          return (
            <FormikForm>
              <Container className={css.formData}>
                <NameIdDescriptionTags
                  formikProps={formikProps}
                  identifierProps={{
                    inputName: 'name',
                    isIdentifierEditable: !(isEdit || prevStepData?.isEdit)
                  }}
                />
              </Container>
              <Layout.Horizontal>
                <Button type="submit" intent="primary" text={getString('continue')} />
              </Layout.Horizontal>
            </FormikForm>
          )
        }}
      </Formik>
    </Container>
  )
}

export default StepWinRmDetails
