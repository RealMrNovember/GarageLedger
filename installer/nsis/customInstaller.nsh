; Premium GarageLedger installer — welcome hero shows logo + car (composed BMP).

!include "nsDialogs.nsh"
!include "LogicLib.nsh"

!macro customWelcomePage
  !ifndef BUILD_UNINSTALLER
    Page custom GL_WelcomeCreate GL_WelcomeLeave
  !endif
!macroend

!ifndef BUILD_UNINSTALLER

Var GL_WelcomeHero
Var GL_WelcomeHeroHandle

Function GL_WelcomeCreate
  nsDialogs::Create 1018
  Pop $0

  InitPluginsDir
  !ifdef BUILD_RESOURCES_DIR
    File /nonfatal /oname=$PLUGINSDIR\welcome-hero.bmp "${BUILD_RESOURCES_DIR}\installer\welcome-hero.bmp"
  !endif

  ${NSD_CreateBitmap} 0u 0u 100% 72% ""
  Pop $GL_WelcomeHero
  ${If} ${FileExists} "$PLUGINSDIR\welcome-hero.bmp"
    ${NSD_SetStretchedImage} $GL_WelcomeHero $PLUGINSDIR\welcome-hero.bmp $GL_WelcomeHeroHandle
  ${EndIf}

  ${NSD_CreateLabel} 0u 78% 100% 12u "GarageLedger — Quiet Luxury ERP for your garage"
  Pop $0

  nsDialogs::Show
FunctionEnd

Function GL_WelcomeLeave
  ${If} $GL_WelcomeHeroHandle != ""
    ${NSD_FreeImage} $GL_WelcomeHeroHandle
  ${EndIf}
FunctionEnd

!endif
