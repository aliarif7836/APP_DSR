@web @dsr
Feature: DSR - Daily Status Report
  As an employee
  I want to open My DSR and start adding today's task details
  So that my daily work is reported

  Background:
    Given User is logged in to the dashboard

  @TC_DASH_DSR_1
  Scenario: Navigate to My DSR and open the Add form
    When User clicks on DSR in the side menu
    And User clicks on My DSR
    And User clicks on the Add button
    Then The Add DSR form should be visible

  @TC_DASH_DSR_2 @dsr_today
  Scenario: Fill and submit today's DSR
    When User clicks on DSR in the side menu
    And User clicks on My DSR
    And User clicks on the Add button
    And User fills today's DSR form
    And User submits the DSR form
