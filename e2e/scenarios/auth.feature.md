# Feature: Request Authentication

As a user
I want to configure authentication for my requests
So that I can test protected API endpoints

---

## Background

Given the app is loaded
And a new request tab is open
And I navigate to the "Auth" tab in the request editor

---

## Scenario: Send a request with no authentication

When I select "No Auth" as the auth type
And I send the request
Then no Authorization header is added to the request

---

## Scenario: Send a request with Bearer token

When I select "Bearer Token" as the auth type
And I enter a valid token in the token field
And I send the request
Then the request is sent with the header "Authorization: Bearer {token}"

---

## Scenario: Send a request with Basic Auth

When I select "Basic Auth" as the auth type
And I enter a username and password
And I send the request
Then the request is sent with the "Authorization: Basic {base64}" header

---

## Scenario: Send a request with API Key in header

When I select "API Key" as the auth type
And I enter a key name and value
And I set "Add to" as "Header"
And I send the request
Then the request is sent with the custom header containing the API key

---

## Scenario: Send a request with API Key in query parameter

When I select "API Key" as the auth type
And I enter a key name and value
And I set "Add to" as "Query Param"
And I send the request
Then the API key is appended as a query parameter in the request URL

---

## Scenario: Clear authentication from a request

Given a request has Bearer Token configured
When I switch the auth type to "No Auth"
Then the Authorization header is removed from the request
