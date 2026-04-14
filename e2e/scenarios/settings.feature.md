# Feature: Settings

As a user
I want to configure app preferences
So that the app behaves according to my workflow

---

## Background

Given the app is loaded

---

## Scenario: Toggle dark mode

Given I open the Settings page
When I select "Dark" as the theme
Then the app switches to dark mode

When I select "Light" as the theme
Then the app switches to light mode

When I select "System" as the theme
Then the app follows the OS theme preference

---

## Scenario: Toggle SSL verification

Given I open the Settings page
When I toggle the "SSL Verification" option off
And I send a request to a server with a self-signed certificate
Then the request is sent without SSL errors

---

## Scenario: Toggle follow redirects

Given I open the Settings page
When I disable the "Follow Redirects" option
And I send a request that returns a 3xx redirect
Then the response shows the redirect status code (not the final destination)

---

## Scenario: Set a custom proxy URL

Given I open the Settings page
When I enter a custom proxy URL in the Proxy URL field
Then subsequent requests are routed through the specified proxy

---

## Scenario: View keyboard shortcuts

Given I open the Settings page
When I click on the "Shortcuts" section
Then a list of all available keyboard shortcuts is displayed
And shortcuts are grouped by category (Request, Workspace, Tabs)
