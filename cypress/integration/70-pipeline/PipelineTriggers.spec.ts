import {
  inputSetListAPI,
  inputSetsTemplateCall,
  pipelineSummaryCallAPI,
  routingDataAPI,
  servicesCallV2,
  servicesV2AccessResponse,
  triggerPiplelineDetails,
  triggersAPI,
  triggersListData,
  triggersRoute
} from '../../support/70-pipeline/constants'

describe('Triggers for Pipeline', () => {
  const visitTriggersPageWithAssertion = (): void => {
    cy.visit(triggersRoute, {
      timeout: 30000
    })
    cy.wait(2000)
    cy.visitPageAssertion()
  }
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()

    cy.intercept('GET', routingDataAPI, { fixture: 'ng/api/routingData' }).as('routingData')

    cy.intercept('GET', pipelineSummaryCallAPI, { fixture: '/ng/api/pipelineSummary' }).as('pipelineSummary')
    cy.intercept('GET', triggersAPI, { fixture: 'ng/api/triggers/triggersList.empty.json' }).as('emptyTriggersList')

    switch (Cypress.currentTest.title) {
      case 'Pipeline Trigger List assertion': {
        cy.intercept('GET', triggersAPI, { fixture: 'ng/api/triggers/triggerList.json' }).as('triggerList')
        visitTriggersPageWithAssertion()
        break
      }
      default: {
        visitTriggersPageWithAssertion()
        break
      }
    }
  })

  it('Triggers Drawer & List Assertion', () => {
    cy.wait(1000)
    cy.wait('@emptyTriggersList')
    cy.contains('span', '+ New Trigger').should('be.visible')
    cy.contains('span', 'Add New Trigger').should('be.visible').click()

    cy.get('*[class^="AddDrawer"]').should('be.visible')
    cy.get('[class*="AddDrawer"][class*="stepsRenderer"]')
      .should('be.visible')
      .within(() => {
        cy.contains('h2', 'Triggers').should('be.visible')
        Object.entries(triggersListData).forEach(([key, values]) => {
          cy.contains('div', key)
            .should('be.visible')
            .parent()
            .siblings()
            .eq(0)
            .within(() => {
              values.forEach(value => {
                cy.contains('section', value).scrollIntoView().should('be.visible')
              })
            })
        })
      })
    cy.get('[class*="AddDrawer"][class*="categoriesRenderer"]')
      .should('be.visible')
      .within(() => {
        cy.contains('p', 'Triggers').should('be.visible')
        cy.contains('p', 'Show All Triggers').should('be.visible')
        Object.entries(triggersListData).forEach(([key, values]) => {
          cy.contains('section', `${key} (${values.length})`).should('be.visible')
        })
      })
  })

  it('Cron Trigger Flow', () => {
    cy.visitPageAssertion()
    cy.wait('@emptyTriggersList')
    cy.contains('span', 'Add New Trigger').should('be.visible').click()
    cy.intercept('POST', inputSetsTemplateCall, { fixture: '/ng/api/triggers/triggerInputSet' }).as('triggerInputSet')

    cy.intercept('GET', triggerPiplelineDetails, { fixture: 'ng/api/triggers/triggerPiplelineDetails' }).as(
      'triggerPiplelineDetails'
    )

    cy.get('[class*="AddDrawer"][class*="stepsRenderer"]')
      .should('be.visible')
      .within(() => {
        cy.contains('section', 'Cron').scrollIntoView().should('be.visible').click()
      })
    cy.wait('@triggerPiplelineDetails')
    cy.wait(1000)

    // Overview Tab
    cy.fillField('name', 'testTrigger')
    cy.findByText('testTrigger').should('exist')
    cy.get('[value="testTrigger"]').should('be.visible')

    cy.get('span[data-testid="description-edit"]').should('be.visible')
    cy.get('span[data-testid="description-edit"]').click()
    cy.get('span[data-testid="tags-edit"]').should('be.visible')
    cy.get('span[data-testid="tags-edit"]').click()

    cy.fillField('description', 'Test Trigger Description')
    cy.contains('textarea', 'Test Trigger Description').should('be.visible')
    cy.get('input[data-mentions]').clear().type('triggerTag').type('{enter}')
    cy.contains('span', 'triggerTag').should('be.visible')
    cy.contains('span', 'Continue').should('be.visible').click()

    // Schedule Tab
    cy.contains('span', 'Schedule').should('be.visible')
    cy.get("input[name='minutes']").should('be.visible').click()
    cy.contains('li>p', '10').click({ force: true })
    cy.get("input[name='minutes']").should('have.value', '10')
    cy.contains('span', 'Continue').should('be.visible').click()

    // Pipleine Input
    cy.intercept('GET', inputSetListAPI, { fixture: 'pipeline/api/inputSet/emptyInputSetsList' })
    cy.intercept('GET', servicesCallV2, servicesV2AccessResponse).as('servicesCallV2')
    cy.wait('@servicesCallV2').wait(1000)
    cy.contains('span', 'Select Input Set(s)').should('be.visible').click()
    cy.get('[class*="popover-content"]')
      .should('be.visible')
      .within(() => {
        cy.findByText('No Input Sets created').should('exist')
      })
    cy.get('input[placeholder*="Select Service"]').should('be.visible').click({ force: true })
    cy.contains('p', 'testService').click({ force: true })

    // Toggle to YAML view
    cy.get('[data-name="toggle-option-two"]').click({ force: true })
    cy.wait(1000)
    // Verify all details in YAML view
    cy.contains('span', 'testTrigger').should('be.visible')
    cy.contains('span', 'Test Trigger Description').should('be.visible')
    cy.contains('span', 'triggerTag').should('be.visible')

    cy.contains('span', 'project1').should('be.visible')
    cy.contains('span', 'testPipeline_Cypress').should('be.visible')

    cy.contains('span', 'Scheduled').should('be.visible')
    cy.contains('span', 'Cron').scrollIntoView().should('be.visible')

    cy.contains('span', 'expression').should('be.visible')
    cy.contains('span', '0/10 * * * *').should('be.visible')

    cy.contains('span', 'testStage_Cypress').should('be.visible')
    cy.contains('span', 'serviceRef').should('be.visible')
    cy.contains('span', 'testService').should('be.visible')

    // Saving trigger
    cy.contains('span', 'Create Trigger').should('be.visible').click()
    cy.wait(1000)
    cy.contains('span', 'Successfully created').should('be.visible')
  })

  it('Pipeline Trigger List assertion', () => {
    cy.wait(1000)
    cy.wait('@triggerList', { timeout: 30000 })
    cy.wait(1000)
    cy.contains('p', 'testTrigger').should('be.visible')

    cy.get('span[data-icon="main-tags"]').should('be.visible')
    cy.get('span[data-icon="main-tags"]').trigger('mouseover')
    cy.contains('p', 'TAGS').should('be.visible')
    cy.contains('span', 'triggerTag').should('be.visible')

    cy.get('span[icon="more"]').should('be.visible').click()
    cy.wait(500)
    cy.contains('div', 'Delete').click()

    cy.contains('span', 'Delete').should('be.visible').click()
    cy.wait(1000)
    cy.contains('span', 'Trigger testTrigger Deleted').should('be.visible')
  })
})
