/** Shared buyer dashboard layout — sidebar desktop, bottom nav mobile */
export const BUYER_SHELL_CSS = `
  @media (min-width:768px) {
    .buyer-bottom-nav    { display:none !important; }
    .buyer-sidebar       { display:flex !important; }
    .buyer-root          { padding-bottom:0 !important; }
    .buyer-header-inner  { max-width:none !important; padding-left:264px !important; padding-right:24px !important; }
    .buyer-content-inner { margin-left:240px !important; max-width:none !important; width:auto !important; padding:24px 24px 32px !important; }
  }
  @media (max-width:767px) {
    .buyer-content-inner { padding:16px 16px 0 !important; max-width:100% !important; width:100% !important; }
    .buyer-header-inner { padding-left:16px !important; padding-right:16px !important; max-width:100% !important; }
  }
`
