@web @login
Feature: Login to the Appinventiv HR dashboard
  As an employee
  I want to log in with my official credentials
  So that I can access the admin dashboard

  @TC_DASH_Login_1
  Scenario: Login with valid credentials from .env
    Given User is on the dashboard login page
    When User logs in with credentials from env
    Then User should land on the admin dashboard
