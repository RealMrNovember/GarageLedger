; Custom NSIS branding hooks for GarageLedger (electron-builder).
; Placeholder wizard.gif lives in build/installer/wizard.gif — replace with your own animation.

!macro customHeader
  !ifdef BUILD_RESOURCES_DIR
    !if /FileExists "${BUILD_RESOURCES_DIR}\installer\wizard.gif"
      ; Reserved for future AdvSplash / custom welcome animation wiring.
    !endif
  !endif
!macroend

!macro customWelcomePage
  ; Premium installer: sidebar/header bitmaps are set via electron-builder (installerSidebar).
!macroend
