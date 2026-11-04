# Accessibility verification — scheduling follow-up

Scope: the modern single/range/value inputs and their precise/orbital controls in
3D and LCD. This is a verification record, not a conformance certificate.

## Physical-device check — 4 November 2026

Thomas tested the local scheduling preview on an iPhone with VoiceOver. He
reported **both styles work** for this requested flow:

1. Open Booking and reach the Start/End controls.
2. Switch endpoint and adjust a date.
3. Check that labels and selected values are announced and controls are reachable.
4. Activate Done and verify focus returns to Booking.
5. Repeat in LCD through the shared appearance header.

This is the user's reported result, not an automated simulation or an independent
audit. iPhone model, iOS version and Safari version were not recorded. No Android
TalkBack or Windows NVDA device result is claimed.

## Automated and browser checks

The new browser suite exercises keyboard range edits, explicit endpoint state,
form validation/reset/clearing, unavailable values, locale column order, 12-hour
periods, date-only values across zone changes, Arabic RTL, forced colours,
reduced motion and narrow layouts. Exact results and test limits are recorded in
[the release validation record](release-validation.md). Earlier accessibility coverage remains in
[the design review](design-accessibility.md).

## Repeatable human flow

Use the **Ranges & scheduling** documentation page. Its Component settings are
outside the picker. Test 3D and LCD, light/dark appearance and a custom palette.

- Open a field from its label, activate list options and step controls, then
  choose Done. Confirm the input name, value, expanded state and returned focus.
- Switch Start/End without dismissing the popup. Check the endpoint buttons and
  orbital handles announce their purpose and selected state.
- Enable weekdays and business hours. Confirm unavailable options are announced;
  attempt a blocked date, then select a valid date through an alternative control.
- Clear a required range and submit. Confirm the error is announced, focus moves
  to the field, and invalid values do not submit. Reset and submit again.
- Test French and Arabic. Check labels, month values, AM/PM, focus order and RTL
  placement. Switching to Minutes must keep the window open.
- Increase browser zoom and text size. Precise controls and Done must remain
  reachable; the host page must not gain unwanted horizontal scrolling. Extreme
  text sizing may use the popup's existing content-scroll fallback.

A desktop can expose the static documentation to a phone on the same network:
`SKYDIAL_HOST=0.0.0.0 node scripts/serve-docs.mjs`. The default remains localhost.
This serves only the generated public package site. Local-network URLs may change
when the machine reconnects; device location also requires a secure context and
is not part of this local HTTP test.
