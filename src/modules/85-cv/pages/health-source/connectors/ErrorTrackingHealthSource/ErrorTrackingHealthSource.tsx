/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useCallback, useContext } from 'react'
import { Formik, FormikForm } from '@wings-software/uicore'
import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import type { ErrorTrackingHealthSourceProps } from './ErrorTrackingSource.types'
import DrawerFooter from '../../common/DrawerFooter/DrawerFooter'
import { createErrorTrackingHealthSourcePayload } from './ErrorTrackingHealthSource.utils'

export default function ErrorTrackingHealthSource(props: ErrorTrackingHealthSourceProps): JSX.Element {
  const { data: sourceData, onSubmit } = props
  const { onPrevious } = useContext(SetupSourceTabsContext)

  const handleOnSubmit = useCallback(
    async () => {
      const healthSourcePayload = createErrorTrackingHealthSourcePayload(sourceData)
      await onSubmit(sourceData, healthSourcePayload)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceData]
  )

  return (
    <Formik<any>
      enableReinitialize
      formName={'errorTrackingHealthSourceform'}
      initialValues={{}}
      onSubmit={async () => {
        await handleOnSubmit()
      }}
    >
      {formik => (
        <FormikForm>
          <DrawerFooter isSubmit onPrevious={onPrevious} onNext={formik.submitForm} />
        </FormikForm>
      )}
    </Formik>
  )
}
