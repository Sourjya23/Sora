import React from "react";

function JitsiRoom({ roomName, userName }) {
  // Construct the Jitsi URL with configurations
  // config.prejoinPageEnabled=false disables Jitsi's prejoin because we use our own lobby screen
  const jitsiUrl = `https://jitsi.riot.im/${roomName}#config.prejoinPageEnabled=false&userInfo.displayName="${encodeURIComponent(userName || "User")}"&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.analytics.disabled=true`;

  return (
    <div className="h-full w-full bg-slate-950">
      <iframe
        src={jitsiUrl}
        allow="camera; microphone; display-capture; autoplay; clipboard-write"
        className="w-full h-full border-0"
        title="Jitsi Meeting"
      />
    </div>
  );
}

export default JitsiRoom;
