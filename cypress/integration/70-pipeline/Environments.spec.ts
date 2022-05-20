import { environmentRoute, environmentsCall, envUpsertCall } from '../../support/70-pipeline/constants'

describe('Environment for Pipeline', () => {
  const visitEnvironmentsPageWithAssertion = (): void => {
    cy.visit(environmentRoute, {
      timeout: 30000
    })
    cy.wait(1000)
    cy.visitPageAssertion()
  }

  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()

    switch (Cypress.currentTest.title) {
      case 'Environment Addition & YAML/visual parity': {
        cy.intercept('GET', environmentsCall, { fixture: 'ng/api/environments/environments.empty.json' }).as(
          'emptyEnvironments'
        )
        visitEnvironmentsPageWithAssertion()
        cy.wait('@emptyEnvironments', { timeout: 30000 })
        break
      }
      default: {
        cy.intercept('GET', environmentsCall, { fixture: 'ng/api/environments/environmentsList.json' }).as(
          'environmentsList'
        )
        visitEnvironmentsPageWithAssertion()
        cy.wait('@environmentsList', { timeout: 30000 })
        break
      }
    }
  })

  it('Environment Addition & YAML/visual parity', () => {
    cy.wait(500)
    cy.contains('h2', 'No Environments Available').should('be.visible')
    cy.contains('span', 'New Environment').should('be.visible')
    cy.contains('span', 'New Environment').click()
    cy.wait(1000)

    cy.fillName('testEnv')
    cy.get('span[data-testid="description-edit"]').should('be.visible')
    cy.get('span[data-testid="description-edit"]').click()
    cy.get('span[data-testid="tags-edit"]').should('be.visible')
    cy.get('span[data-testid="tags-edit"]').click()

    cy.fillField('description', 'Test Environment Description')
    cy.contains('textarea', 'Test Environment Description').should('be.visible')
    cy.get('input[data-mentions]').clear().type('envTag').type('{enter}')
    cy.contains('span', 'envTag').should('be.visible')
    cy.contains('p', 'Production').click()

    // YAML assertion
    cy.get('[data-name="toggle-option-two"]').click()

    cy.contains('span', 'testEnv').should('be.visible')
    cy.contains('span', 'Test Environment Description').should('be.visible')
    cy.contains('span', 'envTag').should('be.visible')
    cy.contains('span', 'Prod').should('be.visible')

    // Saving
    cy.contains('span', 'Save').click()
    cy.wait(2000)
    cy.contains('span', 'Environment created successfully').should('be.visible')
  })

  it('Environment Assertion and Edit', () => {
    cy.wait(1000)
    cy.contains('p', 'testEnv').should('be.visible')
    cy.contains('p', 'Test Environment Description').should('be.visible')
    cy.contains('p', 'Prod').should('be.visible')

    cy.get('span[data-icon="main-tags"]').should('be.visible')
    cy.get('span[data-icon="main-tags"]').trigger('mouseover')
    cy.contains('p', 'TAGS').should('be.visible')

    cy.get('span[data-icon="Options"]').should('be.visible')
    cy.get('span[data-icon="Options"]').click()
    cy.contains('div', 'Edit').click()

    //Edit values
    cy.wait(1000)
    cy.fillName('New testEnv')
    cy.get('button[data-testid="thumbnail-select-change"]').click()
    cy.contains('p', 'Pre Production').click()

    // YAML assertion
    cy.get('[data-name="toggle-option-two"]').click()

    cy.contains('span', 'New testEnv').should('be.visible')
    cy.contains('span', 'Test Environment Description').should('be.visible')
    cy.contains('span', 'env').should('be.visible')
    cy.contains('span', 'PreProduction').should('be.visible')

    //upsert call
    cy.intercept('GET', envUpsertCall, { fixture: 'ng/api/environments/upsertCall.json' })
    cy.intercept('GET', environmentsCall, { fixture: 'ng/api/environments/environmentListUpdate.json' }).as(
      'environmentListUpdate'
    )
    cy.contains('span', 'Save').click()

    //Updated list
    cy.wait('@environmentListUpdate')

    //check if list updated
    cy.contains('p', 'New testEnv').should('be.visible')
    cy.contains('p', 'Pre-Prod').should('be.visible')

    cy.contains('span', 'Environment updated successfully').should('be.visible')
  })

  it('Environment Assertion and Deletion', () => {
    cy.wait(1000)
    cy.contains('p', 'testEnv').should('be.visible')
    cy.contains('p', 'Test Environment Description').should('be.visible')
    cy.contains('p', 'Prod').should('be.visible')

    cy.get('span[data-icon="main-tags"]').should('be.visible')
    cy.get('span[data-icon="main-tags"]').trigger('mouseover')
    cy.contains('p', 'TAGS').should('be.visible')

    cy.get('span[data-icon="Options"]').should('be.visible')
    cy.get('span[data-icon="Options"]').click()
    cy.contains('div', 'Delete').click()

    cy.contains('span', 'Confirm').should('be.visible')
    cy.contains('span', 'Confirm').click()
    cy.wait(1000)
    cy.contains('span', 'Successfully deleted environment testEnv').should('be.visible')
  })
})
