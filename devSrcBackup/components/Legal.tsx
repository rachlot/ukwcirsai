import CookieConsent from "react-cookie-consent";

/**
 * Legal consent text
 * needs to be set before we log in
 * thus cannot be part of UISettings
 */
export const Legal = () => <CookieConsent>
    <span>
        By using the Dashjoin services, you acknowledge that
        you have read and understand our <a style={{ color: 'inherit' }} href="https://dashjoin.com/legal.html#cookies" target="_blank">Cookie Policy</a>
        , <a style={{ color: 'inherit' }} href="https://dashjoin.com/legal.html#privacy" target="_blank">Privacy Policy</a> and
        our <a style={{ color: 'inherit' }} href="https://dashjoin.com/legal.html#terms" target="_blank">Terms of Service</a>.
        Otherwise click <a style={{ color: 'inherit' }} href="https://dashjoin.com">here</a> to leave.
    </span>
</CookieConsent>
