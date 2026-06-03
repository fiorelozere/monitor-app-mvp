export const participantJitsiNative = {
  featureFlags: {
    'prejoinpage.enabled': false,
    'recording.enabled': false,
    'live-streaming.enabled': false,
    'android.screensharing.enabled': false,
    'invite.enabled': false,
    'chat.enabled': false,
    'toolbox.alwaysVisible': false,
    'filmstrip.enabled': false,
  },
  configOverrides: {
    resolution: 360,
    prejoinPageEnabled: false,
    disableDeepLinking: true,
    disableFilmstrip: true,
    toolbarButtons: ['hangup'],
  },
  chatEnabled: false,
  inviteEnabled: false,
  recordingEnabled: false,
  liveStreamingEnabled: false,
  screenSharingEnabled: false,
};
