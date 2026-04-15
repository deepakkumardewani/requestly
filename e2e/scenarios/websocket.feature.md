# Feature: WebSocket Connections

As a user
I want to connect to a WebSocket endpoint and exchange messages
So that I can debug real-time APIs

---

## Scenario: Connect

Given the app is loaded
And I open a WebSocket tab
When I enter a valid WebSocket URL
And I click Connect
Then the UI shows a connected state (Disconnect is available)

---

## Scenario: Send message

Given I am connected to a WebSocket
When I type a message and click Send
Then the message log records an outbound (sent) entry with that payload

---

## Scenario: Receive message in log

Given I am connected to an echo WebSocket server
When I send a message
Then the message log records an inbound (received) entry with the echoed payload

---

## Scenario: Disconnect

Given I am connected to a WebSocket
When I click Disconnect
Then the UI returns to a disconnected state (Connect is available)
