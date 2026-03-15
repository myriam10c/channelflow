'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Search, Send, ChevronDown } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Conversation {
  id: string;
  guestName: string;
  propertyName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  channel: 'airbnb' | 'booking' | 'direct' | 'vrbo';
  checkInDate: Date;
  checkOutDate: Date;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'guest' | 'host';
  channel: 'airbnb' | 'booking' | 'direct' | 'vrbo';
  timestamp: Date;
}

const QUICK_REPLIES = [
  'Bienvenue',
  'Instructions d\'arrivée',
  'Rappel départ',
  'Merci pour votre séjour',
  'Besoin d\'aide?',
];

const CHANNEL_COLORS: Record<string, string> = {
  airbnb: 'primary',
  booking: 'secondary',
  direct: 'warning',
  vrbo: 'danger',
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'airbnb' | 'booking'>('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/messages');
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
          if (data.conversations?.length > 0) {
            setSelectedConversationId(data.conversations[0].id);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversationId) return;

      try {
        const response = await fetch(`/api/messages/${selectedConversationId}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);

          // Mark as read
          await fetch(`/api/messages/${selectedConversationId}/read`, {
            method: 'POST',
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
      }
    };

    fetchMessages();
  }, [selectedConversationId]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.propertyName.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'unread') return matchesSearch && conv.unreadCount > 0;
    if (filterType === 'airbnb') return matchesSearch && conv.channel === 'airbnb';
    if (filterType === 'booking') return matchesSearch && conv.channel === 'booking';
    return matchesSearch;
  });

  // Handle send message
  const handleSendMessage = async (messageText: string = newMessage) => {
    if (!messageText.trim() || !selectedConversationId) return;

    try {
      setSending(true);
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          content: messageText,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setShowQuickReplies(false);
        // Refresh messages
        const messagesResponse = await fetch(`/api/messages/${selectedConversationId}`);
        if (messagesResponse.ok) {
          const data = await messagesResponse.json();
          setMessages(data.messages || []);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  return (
    <div className="h-screen flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <MessageCircle className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Panel - Conversations */}
        <div className="w-1/3 flex flex-col gap-4 min-w-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'unread', 'airbnb', 'booking'].map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterType(filter as typeof filterType)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filterType === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {filter === 'all' && 'Tous'}
                {filter === 'unread' && 'Non lus'}
                {filter === 'airbnb' && 'Airbnb'}
                {filter === 'booking' && 'Booking'}
              </button>
            ))}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto space-y-2 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-400">Chargement...</div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-400">Aucune conversation</div>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  padding="md"
                  clickable
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`cursor-pointer transition-all ${
                    selectedConversationId === conversation.id
                      ? 'bg-blue-600/20 border-blue-600/50'
                      : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-100 truncate">
                          {conversation.guestName}
                        </h3>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="primary" size="sm">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 truncate">
                        {conversation.propertyName}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge
                        variant={CHANNEL_COLORS[conversation.channel] as any}
                        size="sm"
                      >
                        {conversation.channel}
                      </Badge>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(conversation.lastMessageTime), {
                          locale: fr,
                          addSuffix: false,
                        })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Chat View */}
        <div className="w-2/3 flex flex-col gap-4 min-w-0">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <Card padding="md" className="flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">
                      {selectedConversation.guestName}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {selectedConversation.propertyName}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={CHANNEL_COLORS[selectedConversation.channel] as any}
                        size="sm"
                      >
                        {selectedConversation.channel}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Arrivée:{' '}
                        {new Date(selectedConversation.checkInDate).toLocaleDateString('fr-FR')} · Départ:{' '}
                        {new Date(selectedConversation.checkOutDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Messages Thread */}
              <Card
                padding="md"
                className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0"
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    Aucun message
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'host' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs ${
                          message.sender === 'host'
                            ? 'bg-blue-600 text-white rounded-lg rounded-br-none'
                            : 'bg-slate-800 text-slate-100 rounded-lg rounded-bl-none'
                        } px-4 py-2`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs opacity-75">
                            {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <Badge
                            variant={CHANNEL_COLORS[message.channel] as any}
                            size="sm"
                          >
                            {message.channel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </Card>

              {/* Message Input */}
              <Card padding="md" className="flex-shrink-0">
                <div className="space-y-3">
                  {showQuickReplies && (
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_REPLIES.map((reply) => (
                        <button
                          key={reply}
                          onClick={() => handleSendMessage(reply)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors text-left"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          handleSendMessage();
                        }
                      }}
                      placeholder="Tapez votre message..."
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={sending || !newMessage.trim()}
                        icon={<Send className="w-4 h-4" />}
                        size="md"
                      >
                        Envoyer
                      </Button>
                      <button
                        onClick={() => setShowQuickReplies(!showQuickReplies)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
                        title="Réponses rapides"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-slate-400 text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez une conversation pour commencer</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
