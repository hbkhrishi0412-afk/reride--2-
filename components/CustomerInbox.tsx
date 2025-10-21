import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Conversation, User, ChatMessage } from '../types';
import ReadReceiptIcon, { OfferMessage, OfferModal } from './ReadReceiptIcon';
import InlineChat from './InlineChat';

interface CustomerInboxProps {
  conversations: Conversation[];
  onSendMessage: (vehicleId: number, messageText: string, type?: ChatMessage['type'], payload?: any) => void;
  onMarkAsRead: (conversationId: string) => void;
  users: User[];
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  onUserTyping: (conversationId: string, userRole: 'customer' | 'seller') => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onFlagContent: (type: 'vehicle' | 'conversation', id: number | string, reason: string) => void;
  onOfferResponse: (conversationId: string, messageId: number, response: 'accepted' | 'rejected' | 'countered', counterPrice?: number) => void;
}

const TypingIndicator: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex items-start">
        <div className="rounded-xl px-4 py-3 max-w-lg bg-spinny-light-gray dark:bg-brand-gray-700 text-spinny-text-dark dark:text-brand-gray-200 flex items-center space-x-2">
            <span className="text-sm font-medium">{name} is typing</span>
            <div className="w-1.5 h-1.5 bg-white0 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-white0 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-white0 rounded-full animate-bounce"></div>
        </div>
    </div>
);

const TestDriveRequestMessage: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
    const { date, time, status } = msg.payload || {};
    const statusInfo = {
        pending: { text: "Pending", color: "bg-spinny-blue-light text-spinny-text-dark dark:bg-spinny-blue/50 dark:text-spinny-text-dark" },
        confirmed: { text: "Confirmed", color: "bg-spinny-orange-light text-spinny-orange dark:bg-spinny-orange/50 dark:text-spinny-orange" },
        rejected: { text: "Declined", color: "bg-spinny-orange-light text-spinny-orange dark:bg-spinny-orange/50 dark:text-spinny-orange" },
        countered: { text: "Countered", color: "bg-white-dark text-spinny-text-dark dark:bg-white dark:text-spinny-text-dark" },
        accepted: { text: "Accepted", color: "bg-spinny-orange-light text-spinny-orange dark:bg-spinny-orange/50 dark:text-spinny-orange" },
    };
    return (
        <div className={`p-3 border-l-4 rounded-lg bg-spinny-off-white dark:bg-brand-gray-700/50 ${status === 'pending' ? 'border-gray-200' : status === 'confirmed' ? 'border-spinny-orange' : 'border-spinny-orange'}`}>
            <p className="font-semibold text-spinny-text-dark dark:text-spinny-text-dark">Test Drive Request</p>
            <p className="text-sm text-brand-gray-600 dark:text-spinny-text-dark">Date: {date}</p>
            <p className="text-sm text-brand-gray-600 dark:text-spinny-text-dark">Time: {time}</p>
            <div className="mt-2 flex items-center justify-between">
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusInfo[status || 'pending'].color}`}>
                    Status: {statusInfo[status || 'pending'].text}
                </span>
            </div>
        </div>
    );
};

const CustomerInbox: React.FC<CustomerInboxProps> = ({ conversations, onSendMessage, onMarkAsRead, users, typingStatus, onUserTyping, onMarkMessagesAsRead, onFlagContent, onOfferResponse }) => {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [conversations]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConv(conv);
    if (conv.isReadByCustomer === false) {
      onMarkAsRead(conv.id);
      onMarkMessagesAsRead(conv.id, 'customer');
    }
  }, [onMarkAsRead, onMarkMessagesAsRead]);

  useEffect(() => {
    if (!selectedConv && sortedConversations.length > 0) {
      const firstConv = sortedConversations[0];
      handleSelectConversation(firstConv);
    }
    if (selectedConv && !conversations.find(c => c.id === selectedConv.id)) {
        setSelectedConv(null);
    }
  }, [conversations, sortedConversations, selectedConv, handleSelectConversation]);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView();
  }, [selectedConv?.messages, typingStatus]);

  useEffect(() => {
      if (selectedConv) {
          const updatedConversation = conversations.find(c => c.id === selectedConv.id);
          if (updatedConversation && (updatedConversation.messages.length !== selectedConv.messages.length || updatedConversation.isFlagged !== selectedConv.isFlagged)) {
              setSelectedConv(updatedConversation);
          }
      }
  }, [conversations, selectedConv]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);
    if (selectedConv) {
        onUserTyping(selectedConv.id, 'customer');
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim() && selectedConv) {
      onSendMessage(selectedConv.vehicleId, replyText);
      setReplyText("");
    }
  };
  
  const handleFlagClick = () => {
    if (selectedConv && !selectedConv.isFlagged) {
        if(window.confirm('Are you sure you want to report this conversation for review?')) {
            const reason = window.prompt("Please provide a reason for reporting this conversation (optional):");
            if (reason !== null) {
                onFlagContent('conversation', selectedConv.id, reason || "No reason provided");
                // Optimistically update UI
                setSelectedConv(prev => prev ? {...prev, isFlagged: true, flagReason: reason || "No reason provided"} : null);
            }
        }
    }
  };

  const handleSendOffer = (price: number) => {
    if (selectedConv) {
        onSendMessage(selectedConv.vehicleId, `Offer: ${price}`, 'offer', {
            offerPrice: price,
            status: 'pending'
        });
        setIsOfferModalOpen(false);
    }
  };

  const getSellerName = (sellerId: string) => {
    return users.find(u => u.email === sellerId)?.name || 'Seller';
  }
  const formInputClass = "flex-grow p-3 border border-gray-200-300 dark:border-gray-200-300 rounded-lg focus:outline-none transition bg-white dark:text-spinny-text-dark";

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b border-gray-200 pb-4">My Inbox</h1>
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 bg-white rounded-xl shadow-lg h-[75vh]">
          {/* Conversation List */}
          <aside className="border-r border-gray-200-200 dark:border-gray-200-200 flex flex-col">
            <div className="p-4 border-b border-gray-200-200 dark:border-gray-200-200">
                  <h2 className="text-lg font-bold text-spinny-text-dark dark:text-spinny-text-dark">Conversations</h2>
            </div>
            <div className="overflow-y-auto">
                  {sortedConversations.length > 0 ? (
                      <ul>
                          {sortedConversations.map(conv => {
                              const lastMessage = conv.messages[conv.messages.length - 1];
                              const messageText = lastMessage?.type === 'offer'
                                  ? `Offer: ${lastMessage.payload?.offerPrice}`
                                  : lastMessage?.text || 'No messages yet.';
                              return (
                                  <li key={conv.id}>
                                      <button
                                          onClick={() => handleSelectConversation(conv)}
                                          className={`w-full text-left p-4 border-l-4 transition-colors ${selectedConv?.id === conv.id ? 'bg-spinny-off-white dark:bg-white' : 'border-transparent hover:bg-spinny-off-white dark:hover:bg-brand-gray-700'}`} style={selectedConv?.id === conv.id ? { borderColor: '#FF6B35' } : undefined}
                                      >
                                          <div className="flex justify-between items-center mb-1">
                                              <p className="font-bold text-spinny-text-dark dark:text-spinny-text-dark truncate">{conv.vehicleName}</p>
                                              {!conv.isReadByCustomer && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 ml-2" style={{ backgroundColor: '#FF6B35' }}></div>}
                                          </div>
                                          <p className="text-sm text-brand-gray-600 dark:text-spinny-text-dark">With {getSellerName(conv.sellerId)}</p>
                                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                                              {lastMessage && (
                                                  lastMessage.sender === 'user' ? (
                                                      <span><span className="font-semibold">You: </span>{lastMessage.type === 'test_drive_request' ? 'Test Drive Request' : messageText}</span>
                                                  ) : lastMessage.sender === 'seller' ? (
                                                      <span><span className="font-semibold">{getSellerName(conv.sellerId)}: </span>{messageText}</span>
                                                  ) : (
                                                      <em>{lastMessage.text}</em>
                                                  )
                                              )}
                                          </p>
                                      </button>
                                  </li>
                              );
                          })}
                      </ul>
                  ) : (
                      <p className="p-4 text-center text-gray-600 dark:text-gray-400">You have no messages yet. Inquire about a vehicle to start a conversation.</p>
                  )}
            </div>
          </aside>

          {/* Chat View */}
          <main className="flex flex-col">
              {selectedConv ? (
                  <InlineChat
                      conversation={selectedConv}
                      currentUserRole="customer"
                      otherUserName={getSellerName(selectedConv.sellerId)}
                      onSendMessage={(messageText, type, payload) => {
                          if (type === 'offer' && payload) {
                              onSendMessage(selectedConv.vehicleId, messageText, type, payload);
                          } else {
                              onSendMessage(selectedConv.vehicleId, messageText);
                          }
                      }}
                      typingStatus={typingStatus}
                      onUserTyping={onUserTyping}
                      onMarkMessagesAsRead={onMarkMessagesAsRead}
                      onFlagContent={onFlagContent}
                      onOfferResponse={onOfferResponse}
                      height="h-96"
                  />
              ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-center p-8 bg-white rounded-lg shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      <h3 className="mt-4 text-xl font-semibold text-gray-900">Select a Conversation</h3>
                      <p className="text-gray-600 mt-1">Choose a conversation from the left to view messages.</p>
                  </div>
              )}
          </main>
      </div>
      {isOfferModalOpen && selectedConv && (
        <OfferModal
            title="Make an Offer"
            listingPrice={selectedConv.vehiclePrice}
            onSubmit={handleSendOffer}
            onClose={() => setIsOfferModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerInbox;