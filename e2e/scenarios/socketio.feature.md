# Feature: Socket.IO Connections

As a user
I want to connect to a Socket.IO server and emit events
So that I can debug Socket.IO APIs

---

## Scenario: Connect

Given the app is loaded
And I open a Socket.IO tab
When I enter a valid Socket.IO server URL
And I click Connect
Then the UI shows a connected state (Disconnect is available)

---

## Scenario: Emit event with data

Given I am connected via Socket.IO
When I set an event name and payload
And I click Send
Then the message log records an outbound (sent) entry

---

## Scenario: Receive event in log

Given I am connected to a server that echoes or pushes events
When an event is received
Then the message log records an inbound (received) entry

---

## Scenario: Disconnect

Given I am connected via Socket.IO
When I click Disconnect
Then the UI returns to a disconnected state (Connect is available)
