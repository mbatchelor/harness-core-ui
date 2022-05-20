/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
import '@testing-library/cypress/add-commands'
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command'
import { getConnectorIconByType } from '../utils/connctors-utils'
import { activeTabClassName } from './70-pipeline/constants'
import {
  servicesCall,
  servicesResponse,
  environmentsCall,
  environmentResponse
} from './85-cv/monitoredService/constants'

import {
  applyTemplatesCall,
  inputSetsTemplateCallResponse,
  monitoresServices,
  monitoresServicesResponse,
  pipelineSteps,
  pipelineStepsResponse,
  servicesCall as verifyStepServicesCall,
  stagesExecutionList,
  stagesExecutionListResponse,
  strategies,
  strategiesResponse,
  strategiesYAMLResponse,
  strategiesYamlSnippets2,
  strategiesYamlSnippets3,
  variables,
  inputSetsCall,
  variablesV2PostResponse
} from './85-cv/verifyStep/constants'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    /* eslint-disable @typescript-eslint/no-unused-vars  */
    interface Chainable<Subject> {
      login(username: string, pass: string): void
      visitPageAssertion(className?: string): void
      createDeploymentStage(): void
      visitCreatePipeline(): void
      visitPipelinesList(): void
      visitExecutionsList(): void
      visitChangeIntelligence(): void
      fillName(name: string): void
      initializeRoute(): void
      clickSubmit(): void
      fillField(fieldName: string, value: string): void
      addNewMonitoredServiceWithServiceAndEnv(): void
      mapMetricToServices(hasServiceIndentifier?: boolean): void
      addingGroupName(name: string): void
      populateDefineHealthSource(connectorType: string, connectorName: string, healthSourceName: string): void
      selectFeature(featureName: string): void
      visitVerifyStepInPipeline(): void
      apiMocksForVerifyStep(): void
      verifyStepInitialSetup(): void
      verifyStepSelectConnector(): void
      verifyStepChooseRuntimeInput(): void
      verifyStepSelectStrategyAndVerifyStep(): void
      // https://github.com/jaredpalmer/cypress-image-snapshot
      matchImageSnapshot(snapshotName?: string, options?: unknown): void
    }
  }
}

// We set up the settings
addMatchImageSnapshotCommand({
  customSnapshotsDir: 'cypress/snapshots',
  failureThreshold: 2, // threshold for entire image
  failureThresholdType: 'percent', // percent of image or number of pixels
  customDiffConfig: { threshold: 0.1 }, // threshold for each pixel
  capture: 'viewport' // capture viewport in screenshot
})

// We also overwrite the command, so it does not take a screenshot if we run the tests inside the test runner (cypress:open)
Cypress.Commands.overwrite('matchImageSnapshot', (originalFn, snapshotName, options) => {
  if (Cypress.env('ALLOW_SCREENSHOT')) {
    originalFn(snapshotName, options)
  } else {
    cy.log(`Screenshot comparison is disabled`)
  }
})

Cypress.Commands.add('clickSubmit', () => {
  cy.get('[type="submit"]').click()
})

Cypress.Commands.add('fillField', (fieldName: string, value: string) => {
  cy.get(`[name="${fieldName}"]`).clear().type(value)
})

Cypress.Commands.add('login', (emailValue: string, password: string) => {
  cy.visit('#/login')
  cy.get('[data-id="email-0"] input').clear().type(emailValue)
  cy.get('[data-id="password-1"] input').clear().type(password)
  cy.clickSubmit()
})

Cypress.Commands.add('visitPageAssertion', (className = activeTabClassName) => {
  cy.get(className, {
    timeout: 30000
  }).should('be.visible')
  cy.wait(1000)
})

Cypress.Commands.add('createDeploymentStage', () => {
  cy.get('[icon="plus"]').click()
  cy.findByTestId('stage-Deployment').click()

  cy.fillName('testStage_Cypress')
  cy.clickSubmit()
})

Cypress.Commands.add('visitPipelinesList', () => {
  cy.visitPageAssertion('[class^=SideNav-module_main]')
  cy.contains('p', 'Projects').click()
  cy.visitPageAssertion('.PageBody--pageBody')
  cy.contains('p', 'Project 1').click()
  cy.contains('p', 'Delivery').click()
  cy.contains('p', 'Pipelines').click()
})

Cypress.Commands.add('visitExecutionsList', () => {
  cy.visitPipelinesList()
  cy.contains('p', 'Deployments').click()
})

Cypress.Commands.add('visitCreatePipeline', () => {
  cy.visitPipelinesList()
  cy.contains('span', 'Create a Pipeline').click()
})

Cypress.Commands.add('fillName', (value: string) => {
  cy.fillField('name', value)
})

Cypress.Commands.add('initializeRoute', () => {
  localStorage.setItem('token', 'JTIydG9rZW4lMjI=')
})

Cypress.Commands.add('visitVerifyStepInPipeline', () => {
  cy.visitPipelinesList()
  cy.contains('span', 'Create a Pipeline').click()
})

// Change Intelligence commands
Cypress.Commands.add('visitChangeIntelligence', () => {
  cy.contains('span', 'Service Reliability').click()
  cy.contains('p', 'Select a Project').click()
  cy.contains('p', 'Project 1').click()
})

Cypress.Commands.add('addNewMonitoredServiceWithServiceAndEnv', () => {
  cy.intercept('GET', servicesCall, servicesResponse).as('ServiceCall')
  cy.intercept('GET', environmentsCall, environmentResponse).as('EnvCall')

  cy.contains('span', 'New Monitored Service').click()
  cy.wait('@ServiceCall')
  cy.wait('@EnvCall')
  cy.wait(1000)

  // clear any cached values
  cy.get('body').then($body => {
    if ($body.text().includes('Unsaved changes')) {
      cy.contains('span', 'Discard').click()
    }
  })

  cy.contains('div', 'Unsaved changes').should('not.exist')
  cy.get('button').contains('span', 'Discard').parent().should('be.disabled')

  cy.get('button').contains('span', 'Save').click()

  // Check valiadtions
  cy.contains('span', 'Service is required').should('be.visible')
  cy.contains('span', 'Environment is required').should('be.visible')
  cy.contains('span', 'Monitored Service Name is required').should('be.visible')

  cy.get('input[name="service"]').click()
  cy.contains('p', 'Service 101').click({ force: true })

  cy.contains('span', 'Service is required').should('not.exist')

  cy.get('input[name="environment"]').click()
  cy.contains('p', 'QA').click({ force: true })

  cy.contains('span', 'Environment is required').should('not.exist')
  cy.contains('span', 'Monitored Service Name is required').should('not.exist')

  cy.contains('div', 'Unsaved changes').scrollIntoView().should('be.visible')
  cy.get('button').contains('span', 'Discard').parent().should('be.enabled')
})

Cypress.Commands.add('mapMetricToServices', (hasServiceIndentifier = false) => {
  // Triggering validations again
  cy.findByRole('button', { name: /Submit/i }).click()

  // Verifying validation messages for the metric mapping component
  cy.contains('span', 'One selection is required.').should('be.visible')
  cy.get('input[name="sli"]').click({ force: true })
  cy.contains('span', 'One selection is required.').should('not.exist')

  cy.get('input[name="continuousVerification"]').click({ force: true })
  cy.get('input[name="healthScore"]').click({ force: true })

  cy.contains('span', 'Risk Category is required.').should('exist')
  cy.contains('label', 'Errors').click()
  cy.contains('span', 'Risk Category is required.').should('not.exist')

  cy.contains('span', 'One selection is required.').should('exist')
  cy.get('input[name="higherBaselineDeviation"]').click({ force: true })
  cy.contains('span', 'One selection is required.').should('not.exist')

  if (hasServiceIndentifier) {
    cy.get('input[name="serviceInstance"]').click()
    cy.get('.Select--menuItem').first().click()
  }

  cy.findByRole('button', { name: /Submit/i }).click()
})

Cypress.Commands.add('addingGroupName', name => {
  cy.get('input[name="groupName"]').click()
  cy.get('.Select--menuItem').click()
  cy.get('input[name="name"]').last().type(name)
  cy.findAllByRole('button', { name: /Submit/i })
    .last()
    .click()
})

Cypress.Commands.add('populateDefineHealthSource', (connectorType, connectorName, healthSourceName) => {
  cy.contains('span', 'Add New Health Source').click()
  cy.contains('span', 'Next').click()

  // Validate and fill Define HealthSource Ta
  cy.contains('span', 'Next').click()
  cy.contains('span', 'Source selection is required').should('be.visible')
  cy.get(`span[data-icon=${getConnectorIconByType(connectorType)}]`).click()
  cy.contains('span', 'Name is required.').should('be.visible')
  cy.get('input[name="healthSourceName"]').type(healthSourceName)
  cy.contains('span', 'Source selection is required').should('not.exist')
  cy.contains('span', 'Name is required.').should('not.exist')

  cy.contains('span', 'Connector Selection is required.').should('be.visible')
  cy.get('button[data-testid="cr-field-connectorRef"]').click()
  cy.contains('p', connectorName).click()
  cy.contains('span', 'Apply Selected').click()
  cy.contains('span', 'Connector Selection is required.').should('not.exist')
})

Cypress.Commands.add('selectFeature', featureName => {
  cy.contains('span', 'product is a required field').should('be.visible')
  cy.get('input[name="product"]').click({ force: true })
  cy.contains('p', featureName).click()
  cy.contains('span', 'product is a required field').should('not.exist')
})

Cypress.Commands.add('apiMocksForVerifyStep', () => {
  cy.intercept(
    'POST',
    '/pipeline/api/pipelines?accountIdentifier=accountId&projectIdentifier=project1&orgIdentifier=default',
    {
      status: 'SUCCESS',
      message: null,
      correlationId: 'd174366f-e2dd-4e9a-8474-df2d47c12bec',
      detailedMessage: null,
      responseMessages: []
    }
  ).as('pipelineSave')
  cy.intercept('GET', strategies, strategiesResponse).as('strategiesList')
  cy.intercept('GET', strategiesYamlSnippets3, strategiesYAMLResponse).as('strategiesYaml')
  cy.intercept('GET', strategiesYamlSnippets2, strategiesYAMLResponse).as('strategiesYaml')
  cy.intercept('GET', monitoresServices, monitoresServicesResponse).as('monitoredServices')
  cy.intercept('POST', variables, variablesV2PostResponse).as('variables')
  cy.intercept('POST', pipelineSteps, pipelineStepsResponse).as('pipelineSteps')
  cy.intercept('GET', verifyStepServicesCall, { fixture: 'ng/api/servicesV2' }).as('service')

  cy.intercept('GET', stagesExecutionList, stagesExecutionListResponse).as('stagesExecutionList')
  cy.intercept('POST', inputSetsCall, inputSetsTemplateCallResponse).as('inputSetsTemplateCallResponse')
  cy.intercept('GET', '/ng/api/pipelines/configuration/cd-stage-yaml-snippet?routingId=accountId', {
    fixture: 'pipeline/api/pipelines/failureStrategiesYaml'
  }).as('cdFailureStrategiesYaml')
})

Cypress.Commands.add('verifyStepInitialSetup', () => {
  cy.apiMocksForVerifyStep()
  cy.get('[icon="plus"]', { timeout: 5000 }).first().click({ force: true })
  cy.findByTestId('stage-Deployment').click()

  cy.fillName('testStage_Cypress')
  cy.clickSubmit()

  cy.wait('@cdFailureStrategiesYaml')
  cy.wait('@pipelineSteps')
  cy.wait('@service')
})

Cypress.Commands.add('verifyStepSelectConnector', () => {
  cy.intercept('POST', applyTemplatesCall).as('applyTemplatesCall')
  cy.intercept(
    'GET',
    '/ng/api/connectors?accountIdentifier=accountId&type=K8sCluster&searchTerm=&pageIndex=0&pageSize=10&projectIdentifier=project1&orgIdentifier=default'
  ).as('connectors')
  cy.contains('p', /^Kubernetes$/).click()

  cy.contains('span', 'Select Connector').scrollIntoView()

  cy.contains('span', 'Select Connector').click({ force: true })

  cy.wait('@connectors')

  cy.contains('p', 'test1111', { timeout: 5000 }).should('be.visible')

  cy.contains('p', 'test1111').click({ force: true })

  // cy.wait(500)

  cy.findByRole('button', { name: 'Apply Selected' }).should('be.visible')

  cy.findByRole('button', { name: 'Apply Selected' }).click({ force: true })

  cy.get('[name="namespace"]').scrollIntoView()

  cy.fillField('namespace', 'verify-step')
})

Cypress.Commands.add('verifyStepChooseRuntimeInput', () => {
  cy.get('.MultiTypeInput--FIXED', { timeout: 5000 }).click({ force: true })
  cy.findByText('Runtime input').click()
})

Cypress.Commands.add('verifyStepSelectStrategyAndVerifyStep', () => {
  cy.intercept('POST', applyTemplatesCall).as('applyTemplatesCall')
  // Execution definition
  cy.findByTestId('execution').scrollIntoView().click()

  cy.wait('@strategiesList')
  cy.wait('@strategiesYaml')

  // choosing deployment strategy
  cy.findByRole('button', { name: /Use Strategy/i }).click()
  cy.findByRole('button', { name: /Use Strategy/i }).should('not.be.visible')

  // adding new step
  cy.findByText(/Add step/i).should('be.visible')
  cy.findByText(/Add step/i).click()
  cy.findByTestId('addStepPipeline').should('be.visible')
  cy.findByTestId('addStepPipeline').click()

  cy.wait('@pipelineSteps')

  // click verify step
  cy.findByText(/Verify/i).click()
})
