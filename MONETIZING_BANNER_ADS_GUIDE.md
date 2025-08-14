# Guide: Monetizing lankaadsprivate.com with Banner Ads (AdSense & Adult Networks)

This guide will help you:
- Prepare your site for banner ad monetization
- Apply to Google AdSense and adult ad networks
- Integrate ad code into your React/Next.js app
- Optimize for revenue and compliance

---

## 1. Prepare Your Site
- Ensure your site is live, loads over HTTPS, and is crawlable by search engines.
- Have clear content categories, privacy policy, and terms of use.
- For **adult content**, Google AdSense is NOT allowed. Use adult-friendly ad networks (see below).

---

## 2. Choose an Ad Network
- **Mainstream (non-adult):**
  - [Google AdSense](https://www.google.com/adsense/start/) (no adult content allowed)
  - [Media.net](https://www.media.net/)
- **Adult Content Friendly:**
  - [ExoClick](https://www.exoclick.com/)
  - [JuicyAds](https://juicyads.com/)
  - [TrafficJunky](https://www.trafficjunky.com/)
  - [Adsterra](https://adsterra.com/) (allows some adult)
  - [EroAdvertising](https://www.eroadvertising.com/)
  - [PlugRush](https://www.plugrush.com/)

> **Tip:** For adult sites, ExoClick and JuicyAds are popular and easy to join.

---

## 3. Apply to Ad Networks
- Register and verify your site/domain.
- Wait for approval (can take 1–5 days).
- Once approved, create ad zones (banner sizes: 728x90, 300x250, 160x600, etc.).
- Copy the provided ad code (usually JavaScript snippets).

---

## 4. Integrate Banner Ads in React/Next.js
- **Where to place:** Use your existing ad slots (e.g., leaderboard, sidebar, footer, in-content).
- **How to embed:**
  - Use `dangerouslySetInnerHTML` in React to inject ad network scripts.
  - Example component:
    ```jsx
    // components/BannerAd.js
    import React from 'react';
    export default function BannerAd({ adCode }) {
      return (
        <div className="ad-slot" dangerouslySetInnerHTML={{ __html: adCode }} />
      );
    }
    ```
  - Usage:
    ```jsx
    <BannerAd adCode={`<!-- ExoClick Banner --><script type="application/javascript" src="https://a.exoclick.com/ads.js"></script>`} />
    ```
- **SSR Note:** Only render ad scripts on the client side to avoid hydration errors in Next.js. Example:
    ```jsx
    import { useEffect, useState } from 'react';
    export default function BannerAd({ adCode }) {
      const [show, setShow] = useState(false);
      useEffect(() => { setShow(true); }, []);
      if (!show) return null;
      return <div className="ad-slot" dangerouslySetInnerHTML={{ __html: adCode }} />;
    }
    ```

---

## 5. Ad Placement Best Practices
- Place ads above the fold (e.g., top leaderboard, sidebar)
- Limit the number of ads per page (3–5 is typical)
- Avoid aggressive popups or redirects (hurts SEO and user trust)
- Test different ad networks and placements for best revenue

---

## 6. Compliance & Blocking
- Use the ad network’s dashboard to block categories or advertisers you don’t want.
- For adult networks, enable age disclaimers and follow local laws.
- Always disclose in your privacy policy that you use third-party ads/cookies.

---

## 7. Tracking & Optimization
- Monitor ad performance in your ad network dashboard
- Consider adding Google Analytics for traffic insights
- Try A/B testing different ad placements and networks

---

## 8. Example: Adding ExoClick Banner to Your Site
1. Register at [ExoClick](https://www.exoclick.com/), get approved, and create a banner zone.
2. Copy the JavaScript code they provide (e.g., `<script src="..."></script>`).
3. In your React/Next.js app, create a `BannerAd` component as above.
4. Insert `<BannerAd adCode={...} />` into your ad slots (header, sidebar, etc).
5. Deploy and verify ads are showing.

---

## 9. Adult Ad Network Links
- [ExoClick Signup](https://www.exoclick.com/signup/)
- [JuicyAds Signup](https://juicyads.com/signup/)
- [TrafficJunky Signup](https://www.trafficjunky.com/signup/)

---

## 10. After Going Live
- Monitor for ad script errors or blank spaces (ad blockers)
- Keep your site content fresh for better traffic and revenue
- Experiment with new networks if revenue is low

---

**Need a ready-made BannerAd component or want help with a specific network? Just ask!**
