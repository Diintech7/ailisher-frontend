import React, { useState } from 'react';

// NOTE: Ensure your backend CORS settings allow requests from your frontend's origin.
// For deployment, set REACT_APP_BACKEND_URL in your .env file to your backend URL.
// Only allow trusted users to use this feature, as downloading videos can be resource-intensive.

const extractVideoId = (url) => {
  // Handles various YouTube URL formats
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
};

const BACKEND_URL = 'https://aipbbackend-c5ed.onrender.com';

// Helper function to format time in MM:SS format
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const YouTube = () => {
  const [input, setInput] = useState('');
  const [videoId, setVideoId] = useState('');
  const [error, setError] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [paragraphs, setParagraphs] = useState([]);
  const [totalParagraphs, setTotalParagraphs] = useState(0);
  const [totalSentences, setTotalSentences] = useState(0);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setError('');
    setTranscript('');
    setParagraphs([]);
  };

  const handlePreview = (e) => {
    e.preventDefault(); 
    const id = extractVideoId(input.trim());
    if (id) {
      setVideoId(id);
      setError('');
      setTranscript('');
      setParagraphs([]);
    } else {
      setVideoId('');
      setError('Please enter a valid YouTube link.');
      setTranscript('');
    }
  };

  // Transcribe audio handler
  const handleTranscribe = async () => {
    setTranscribing(true);
    setError('');
    setTranscript('');
    setParagraphs([]);
    try {
      const response = await fetch(`${BACKEND_URL}/api/youtube/transcribe-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: input.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      setTranscript(data.transcript || 'No transcript found.');
      setParagraphs(data.paragraphs || []);
      setTotalParagraphs(data.totalParagraphs || 0);
      setTotalSentences(data.totalSentences || 0);
    } catch (err) {
      setError('Failed to transcribe audio. Please try again.');
    }
    setTranscribing(false);
  };

  // Add a handler to download the transcript as a .txt file
  const handleDownloadTranscript = () => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh] bg-gray-50">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">YouTube Video Preview</h2>
        <form onSubmit={handlePreview} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Paste YouTube link here..."
            value={input}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
            autoFocus
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition-colors duration-200 shadow"
          >
            Preview
          </button>
        </form>
        {error && (
          <div className="mt-4 text-red-600 text-center text-sm">{error}</div>
        )}
        {videoId && !error && (
          <div className="mt-8 flex flex-col items-center">
            <div className="w-full aspect-video max-w-xl rounded-lg overflow-hidden shadow">
              <iframe
                className="w-full h-64 sm:h-80"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video preview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button
                onClick={handleTranscribe}
                disabled={transcribing}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200 shadow disabled:opacity-60"
              >
                {transcribing ? 'Transcribing...' : 'Transcribe'}
              </button>
            </div>
            {transcript && (
              <div className="mt-8 w-full bg-gray-100 rounded-lg p-4 text-gray-800 text-base shadow-inner">
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <h4 className="font-semibold mb-2">Transcript by Paragraph:</h4>
                  <div className="bg-white p-4 rounded border text-sm text-gray-700">
                    {paragraphs && paragraphs.length > 0 ? (
                      <div className="space-y-4">
                        {paragraphs.map((p) => (
                          <div key={p.id} className="mb-2">
                            <span className="font-mono text-xs text-gray-500 mr-2">[{formatTime(p.start)}]</span>
                            <span>{p.sentences.map(s => s.text).join(' ')}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>{transcript}</div>
                    )}
                  </div>
                  <button
                    onClick={handleDownloadTranscript}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200 shadow"
                    disabled={!transcript}
                  >
                    Download Transcript
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTube;