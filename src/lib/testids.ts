/**
 * data-testid kontrakti — Playwright e2e va "Oltin yo'l" avtopilot shu identifikatorlarga tayanadi.
 * UI komponentlar `data-testid={TID.xxx}` qo'yadi. Nomlarni o'zgartirmang.
 */
export const TID = {
  // stage
  stageRole: 'stage-role',            // role switcher root; options have data-role="buyer" etc.
  stageGolden: 'stage-golden',
  stageGoldenNext: 'stage-golden-next',
  stageGoldenPause: 'stage-golden-pause',
  stageTo17: 'stage-to17',
  stageBts: 'stage-bts-arrived',
  stagePlusDay: 'stage-plus-day',
  stagePayday: 'stage-payday',
  stageReset: 'stage-reset',
  stagePhone: 'stage-phone',
  stageDesktop: 'stage-desktop',
  // mobile
  mTabHome: 'm-tab-home', mTabCatalog: 'm-tab-catalog', mTabSell: 'm-tab-sell', mTabCart: 'm-tab-cart', mTabProfile: 'm-tab-profile',
  mForYou: 'm-for-you',
  mListingCard: 'm-listing-card',      // + data-id
  mPriceVerified: 'm-price-verified',
  mAddToCart: 'm-add-to-cart',
  mCheckout: 'm-checkout',
  mBranch: 'm-branch',                 // + data-id
  mPayPayme: 'm-pay-payme',
  mPayConfirm: 'm-pay-confirm',
  mOrderAccepted: 'm-order-accepted',
  mOrderTimeline: 'm-order-timeline',
  mSellStart: 'm-sell-start',
  mSellTitle: 'm-sell-title', mSellPrice: 'm-sell-price', mSellImei: 'm-sell-imei', mSellSubmit: 'm-sell-submit',
  mSellAiDone: 'm-sell-ai-done',
  mOfferAccept: 'm-offer-accept', mOfferDecline: 'm-offer-decline',
  mPush: 'm-push',
  mWalletPaid: 'm-wallet-paid',
  // admin
  aNav: 'a-nav',                       // + data-section
  aQueueItem: 'a-queue-item',          // + data-id
  aModeratorPrice: 'a-moderator-price',
  aSendOffer: 'a-send-offer',
  aPack: 'a-pack',                     // + data-id
  aPrintWaybill: 'a-print-waybill',
  aHandToBts: 'a-hand-to-bts',
  aPayday: 'a-payday',
  aAuditRow: 'a-audit-row',
  aCmdk: 'a-cmdk',
  // bts
  bAccept: 'b-accept-manifest',
  bDelivered: 'b-delivered',           // + data-id
  bAtBranch: 'b-at-branch',
} as const
export type Tid = (typeof TID)[keyof typeof TID]
export const TID_EXTRA = { stageGoldenDone: 'stage-golden-done', stageGoldenStep: 'stage-golden-step', stageCaption: 'stage-caption' } as const
