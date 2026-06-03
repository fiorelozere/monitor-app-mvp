export const adminJitsiConfig = {
  configOverwrite: {
    startWithAudioMuted: true,
    startWithVideoMuted: true,
    prejoinPageEnabled: false,
    startSilent: true,
    disableProfile: true,
    requireDisplayName: false,
    disableDeepLinking: true,
    hideConferenceSubject: true,
    disableModeratorIndicator: true,
  },
  interfaceConfigOverwrite: {
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
    HIDE_INVITE_MORE_HEADER: true,
    MOBILE_APP_PROMO: false,
    SETTINGS_SECTIONS: [],
    DISABLE_FOCUS_INDICATOR: true,
  },
};
