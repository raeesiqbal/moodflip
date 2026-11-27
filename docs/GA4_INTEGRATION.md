# MoodFlip GA4 integration

The site uses one direct Google tag. The old measurement ID and the mentioned GTM container are not loaded by the application. No Meta Pixel or Cloudflare Zaraz integration was found in the repository; check the Cloudflare dashboard separately for Zaraz or injected tags.

## Deployment settings

- Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-WNF04STFYD` in the **build-time** environment. Next.js embeds `NEXT_PUBLIC_` values in the browser bundle. The Worker binding in `cloudflare.config.ts` must match the build value.
- `NEXT_PUBLIC_GA_ENABLED` remains `false` in the Worker configuration until the GA4 dashboard settings below are reviewed. Set it to `true` for the build and Worker only after that review.
- Local development sends nothing to GA4 by default. For isolated local Playwright testing, set `NEXT_PUBLIC_GA_TEST_MODE=true` and intercept Google Analytics collection requests. Never use this switch to send local events to the real property.

## Consent and data sent

The tag is not loaded until the visitor chooses **Allow analytics**. Existing account-registration consent and the old cookie preference are not reused. Visitors can choose **Essential only** and reopen Analytics choices in the footer. Revoking consent reloads the page after updating the tag's consent state and clearing available GA cookies.

Manual `page_view` is limited to fixed public pages such as `/`, `/about`, `/privacy`, `/contact`, `/moods`, `/blog`, `/pricing`, `/refund`, `/resources`, `/disclaimer`, and `/terms`. No page views are sent for individual mood guides, blog articles, profile, authentication, checkout or report routes. Page URLs sent by the application contain no query string, and all page titles and referrers supplied by the application are generic. This limits per-article reporting by design. The app sends only event names for `sign_up`, `login`, `mood_lift`, `mood_lift_saved`, and production `begin_checkout`.

`purchase` requires a server-confirmed successful payment and a production Airwallex environment. It sends the order reference as `transaction_id`, actual amount and currency, and the purchased report name with quantity 1. A browser-local marker prevents repeated sends on reload, and GA4 uses `transaction_id` to deduplicate purchase conversions. No mood selections, account identifiers, email addresses, tokens or report contents are passed as event parameters.

Browser-level tests do not prove the GA4 property has received or processed events. Consent-denied visitors and sandbox payments are intentionally absent from production analytics.

An intercepted real-tag check of the current GA4 property showed an automatic browser-history page view in addition to the application's manual `/moods` page view. Production collection therefore remains disabled until the dashboard's automatic history tracking is switched off and the opt-in real-tag test passes. The test also demonstrated that setting only `send_page_view: false` was insufficient; the application now sets safe global page metadata before loading the tag.

## GA4 dashboard actions before enabling

1. Open **Admin → Data collection and modification → Data streams**, choose the MoodFlip web stream, and confirm its Measurement ID is `G-WNF04STFYD` and its website URL is `https://moodflip.coach`.
2. Open the web stream's **Enhanced measurement** settings. Disable browser-history page views, scrolls, outbound clicks, site search, form interactions, and other automatic interactions that could collect mood-guide URLs, form values, or duplicate the application's manual events. Also review **Configure tag settings → Manage automatic event detection** and turn off browser-history page views and other automatic interactions there. The application's `send_page_view: false` alone does not prevent Enhanced Measurement history page views.
3. In the web stream, open **Redact data**. Enable email-address redaction and add sensitive URL query keys, including `email`, `order`, `token`, `code`, `redirect`, and `state`, to query-parameter redaction. This is a backup protection; the application itself omits query strings from manual events.
4. In **Admin → Data collection and modification → Data collection**, keep Google Signals disabled. Do not connect advertising audiences, remarketing, Ads or Meta tracking for this integration.
5. In **Admin → Data display → Events**, mark `purchase` and `sign_up` as key events after they appear. Consider `mood_lift_saved` only if it is useful as a separate engagement goal. Avoid marking `page_view` as a key event.
6. Check the Cloudflare dashboard for Zaraz or other injected analytics. Remove or disable any tag that sends to the old GA4 property or duplicates the new direct tag.
7. Once those settings are confirmed, set `NEXT_PUBLIC_GA_ENABLED=true` in both build configuration and `cloudflare.config.ts`, build, and deploy. Use Google Tag Assistant to verify consent and a single tag. Then check GA4 Realtime and DebugView with a consented, controlled visit. Those dashboard checks have not been performed by the codebase tests.

Google's documentation: [manual page views and Enhanced Measurement](https://developers.google.com/analytics/devguides/collection/ga4/views), [data redaction](https://support.google.com/analytics/answer/13544947), [key events](https://support.google.com/analytics/answer/13128484), [transaction ID deduplication](https://support.google.com/analytics/answer/12313109).
