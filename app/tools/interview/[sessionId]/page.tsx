'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Send, CheckCircle, MessageCircle, User, Bot, Pause, Play } from 'lucide-react';
import Link from 'next/link';
import { InterviewPrepService, InterviewSession, ChatMessage } from '@/lib/services/interviewPrepService';
import { SpeechUtils } from '@/lib/utils/speechUtils';
import { theme } from '@/lib/theme';

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [autoMode, setAutoMode] = useState(true); // Auto TTS + STT mode

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (session && session.chat.length > 0) {
      scrollToBottom();
      // Auto-start TTS for the latest question if in auto mode
      const latestMessage = session.chat[session.chat.length - 1];
      if (latestMessage.type === 'question' && autoMode && !isWaitingForResponse) {
        playLatestQuestion();
      }
    }
  }, [session?.chat]);

  const loadSession = () => {
    try {
      const foundSession = InterviewPrepService.getSessionById(sessionId);
      if (foundSession) {
        setSession(foundSession);
      } else {
        router.push('/tools/interview');
      }
    } catch (error) {
      console.error('Error loading session:', error);
      router.push('/tools/interview');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const playLatestQuestion = async () => {
    if (!session) return;

    const latestQuestion = session.chat.filter(msg => msg.type === 'question').pop();
    if (!latestQuestion) return;

    try {
      setIsPlaying(true);
      await SpeechUtils.speak(latestQuestion.content);
    } catch (error) {
      console.error('Error playing question:', error);
    } finally {
      setIsPlaying(false);
      // Auto-start STT after TTS finishes
      if (autoMode) {
        startRecording();
      }
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await SpeechUtils.startListening((transcript) => {
        setUserInput(prev => prev + (prev ? ' ' : '') + transcript);
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      await SpeechUtils.stopListening();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      SpeechUtils.stopSpeaking();
      setIsPlaying(false);
    } else {
      await playLatestQuestion();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendMessage = async () => {
    if (!session || !userInput.trim() || isWaitingForResponse) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'answer',
      content: userInput.trim(),
      timestamp: Date.now(),
    };

    const updatedSession = {
      ...session,
      chat: [...session.chat, userMessage],
    };

    setSession(updatedSession);
    setUserInput('');
    setIsWaitingForResponse(true);

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    try {
      const response = await InterviewPrepService.processChatResponse(updatedSession, userMessage.content);

      // Add AI feedback
      const feedbackMessage: ChatMessage = {
        id: `feedback_${Date.now()}`,
        type: 'feedback',
        content: response.feedback,
        timestamp: Date.now(),
      };

      updatedSession.chat.push(feedbackMessage);

      // Add next question if available
      if (response.nextQuestion) {
        const questionMessage: ChatMessage = {
          id: `question_${Date.now()}`,
          type: 'question',
          content: response.nextQuestion,
          timestamp: Date.now(),
        };
        updatedSession.chat.push(questionMessage);
      } else {
        // Interview completed
        updatedSession.completed = true;
        updatedSession.currentPhase = 'completed';
      }

      setSession(updatedSession);
      InterviewPrepService.saveSession(updatedSession);

    } catch (error: any) {
      console.error('Error processing response:', error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'feedback',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };

      const errorSession = {
        ...updatedSession,
        chat: [...updatedSession.chat, errorMessage],
      };

      setSession(errorSession);
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Session not found</p>
          <Link href="/tools/interview" className="text-blue-600 hover:underline">
            Return to interview history
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/tools/interview"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interview Practice</h1>
                <p className="text-sm text-gray-600">
                  {session.jobTitle || 'Practice Session'} • {session.completed ? 'Completed' : 'In Progress'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAutoMode(!autoMode)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                  autoMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {autoMode ? 'Auto Mode' : 'Manual Mode'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="h-96 overflow-y-auto p-6 space-y-6"
          >
            {session.chat.map((message) => (
              <div key={message.id} className={`flex items-start gap-4 ${message.type === 'answer' ? 'justify-end' : ''}`}>
                {message.type !== 'answer' && (
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot size={20} className="text-blue-600" />
                  </div>
                )}
                <div className={`flex-1 max-w-[70%] ${message.type === 'answer' ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-2 mb-2 ${message.type === 'answer' ? 'justify-end' : ''}`}>
                    <span className="text-sm font-medium text-gray-900">
                      {message.type === 'question' ? 'Interviewer' : message.type === 'answer' ? 'You' : 'AI Coach'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    message.type === 'question'
                      ? 'bg-blue-50 border border-blue-200'
                      : message.type === 'answer'
                        ? 'bg-green-50 border border-green-200 ml-auto'
                        : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
                {message.type === 'answer' && (
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-green-600" />
                  </div>
                )}
              </div>
            ))}

            {isWaitingForResponse && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          {!session.completed && (
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your answer here... (Press Enter to send)"
                    className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={isWaitingForResponse}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={togglePlayback}
                    disabled={!session.chat.some(msg => msg.type === 'question')}
                    className={`p-3 rounded-lg transition-colors ${
                      isPlaying
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isPlaying ? 'Stop playback' : 'Play latest question'}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <button
                    onClick={toggleRecording}
                    className={`p-3 rounded-lg transition-colors ${
                      isRecording
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Start voice input'}
                  >
                    {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!userInput.trim() || isWaitingForResponse}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                <span>Press Enter to send • Auto mode: {autoMode ? 'TTS → STT' : 'Manual control'}</span>
                {isRecording && <span className="text-red-600 animate-pulse">● Recording...</span>}
              </div>
            </div>
          )}

          {session.completed && (
            <div className="border-t border-gray-200 p-6 bg-green-50">
              <div className="text-center">
                <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Interview Complete!</h3>
                <p className="text-gray-600 mb-4">
                  Great job practicing! Review your responses above and consider what you learned.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/tools/interview"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start New Interview
                  </Link>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Print Summary
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}