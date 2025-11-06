import React, { useState, useEffect } from 'react';
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsConnectedToRoom,
  selectLocalPeer
} from '@100mslive/hms-video-react';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaChevronDown,
  FaChevronUp,
  FaUsers,
  FaComments,
  FaDesktop
} from 'react-icons/fa';

const LiveClassRoom = ({ token, roomCode, classData }) => {
  return (
    <HMSRoomProvider token={token}>
      <ClassRoomContent roomCode={roomCode} classData={classData} />
    </HMSRoomProvider>
  );
};

const ClassRoomContent = ({ roomCode, classData }) => {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const localPeer = useHMSStore(selectLocalPeer);
  const isAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);

  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [peers, setPeers] = useState([]);
  const [localVideo, setLocalVideo] = useState(null);

  useEffect(() => {
    if (localPeer?.videoTrack) {
      const videoTrack = localPeer.videoTrack;
      const videoElement = document.getElementById('local-video');
      if (videoElement && videoTrack) {
        videoTrack.attach(videoElement);
        setLocalVideo(videoElement);
      }
      return () => {
        if (videoElement && videoTrack) {
          videoTrack.detach();
        }
      };
    }
  }, [localPeer?.videoTrack]);

  useEffect(() => {
    setIsAudioOn(isAudioEnabled);
    setIsVideoOn(isVideoEnabled);
  }, [isAudioEnabled, isVideoEnabled]);

  const toggleAudio = async () => {
    try {
      await hmsActions.setEnabledTrack(!isAudioOn);
      setIsAudioOn(!isAudioOn);
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  };

  const toggleVideo = async () => {
    try {
      await hmsActions.setEnabledTrack(!isVideoOn, 'video');
      setIsVideoOn(!isVideoOn);
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const leaveRoom = async () => {
    try {
      await hmsActions.leave();
      window.location.href = '/user/home';
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{classData?.title || 'Live Class'}</h1>
          <p className="text-sm text-gray-400">{classData?.description || ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Room: {roomCode || classData?.roomCode}
          </span>
          <button
            onClick={leaveRoom}
            className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <FaPhoneSlash /> Leave
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4">
        {/* Video Area */}
        <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
          <div id="local-video" className="w-full h-full" />
          
          {/* Placeholder if no video */}
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUsers className="text-gray-400 text-3xl" />
                </div>
                <p className="text-gray-400">
                  {localPeer?.name || 'You'}
                </p>
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full ${
                isAudioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {isAudioOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${
                isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 rounded-lg p-4 flex flex-col">
          <h2 className="text-white font-semibold mb-4">Class Details</h2>
          
          <div className="space-y-2 text-sm text-gray-300 mb-6">
            <p><strong>Class:</strong> {classData?.title}</p>
            <p><strong>Duration:</strong> {classData?.duration} min</p>
            {classData?.scheduledAt && (
              <p><strong>Scheduled:</strong> {new Date(classData.scheduledAt).toLocaleString()}</p>
            )}
          </div>

          <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <FaUsers /> Participants
              </h3>
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="text-gray-400"
              >
                {showParticipants ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>
            
            {showParticipants && (
              <div className="space-y-2">
                {peers.length > 0 ? (
                  peers.map((peer) => (
                    <div key={peer.id} className="text-gray-300 text-sm py-2 px-3 bg-gray-800 rounded">
                      {peer.name}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No other participants yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-gray-800 px-6 py-3 flex justify-center items-center gap-4">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            isAudioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          } text-white`}
          title={isAudioOn ? 'Mute' : 'Unmute'}
        >
          {isAudioOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          } text-white`}
          title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoOn ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
        </button>

        <button
          onClick={leaveRoom}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white"
          title="Leave class"
        >
          <FaPhoneSlash size={20} />
        </button>
      </div>
    </div>
  );
};

export default LiveClassRoom;

