import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatbotService } from '../services/chatbotService';

interface Message {
  id: number;
  type: 'bot' | 'user';
  content: string;
  options?: string[];
  isLoading?: boolean;
}

const ZALO_LINK = 'https://zalo.me/0937833154';
const PHONE_NUMBER = '0937833154';

const quickOptions = ['Kiểm tra số dư', 'Trạng thái máy in', 'Cách in tài liệu', 'Mua thêm trang', 'Liên hệ hỗ trợ'];

export default function FloatingChatbot() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (showChatbot && messages.length === 0) {
      setMessages([{
        id: 1,
        type: 'bot',
        content: '👋 Xin chào! Tôi là AI Assistant của SPSS SIU.\n\nTôi có thể giúp bạn:\n• Kiểm tra số dư trang in\n• Xem trạng thái máy in\n• Hướng dẫn sử dụng\n\nBạn cần hỗ trợ gì?',
        options: quickOptions
      }]);
    }
  }, [showChatbot]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: text }]);
    setInputValue('');
    setIsTyping(true);

    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: loadingId, type: 'bot', content: '', isLoading: true }]);

    const response = await chatbotService.chat(text);

    setMessages(prev => prev.map(m => 
      m.id === loadingId ? { ...m, content: response, isLoading: false, options: quickOptions } : m
    ));
    setIsTyping(false);
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    setShowMenu(!showMenu);
  };

  const openZalo = () => {
    Linking.openURL(ZALO_LINK);
    setShowMenu(false);
  };

  const callPhone = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
    setShowMenu(false);
  };

  const openChatbot = () => {
    setShowChatbot(true);
    setShowMenu(false);
  };

  return (
    <>
      {/* Floating Button */}
      <View style={styles.floatingContainer}>
        {/* Menu Items */}
        {showMenu && (
          <View style={styles.menuContainer}>
            {/* AI Chat */}
            <TouchableOpacity style={styles.menuItem} onPress={openChatbot}>
              <View style={styles.menuIconBox}>
                <Ionicons name="chatbubble-ellipses" size={22} color="#3B82F6" />
              </View>
              <Text style={styles.menuText}>AI Chat</Text>
            </TouchableOpacity>

            {/* Phone */}
            <TouchableOpacity style={styles.menuItem} onPress={callPhone}>
              <View style={[styles.menuIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="call" size={22} color="#22C55E" />
              </View>
              <Text style={styles.menuText}>Gọi điện</Text>
            </TouchableOpacity>

            {/* Zalo */}
            <TouchableOpacity style={styles.menuItem} onPress={openZalo}>
              <View style={[styles.menuIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Text style={styles.zaloText}>Zalo</Text>
              </View>
              <Text style={styles.menuText}>Zalo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity style={styles.mainButton} onPress={handlePress} activeOpacity={0.8}>
            <Ionicons 
              name={showMenu ? 'close' : 'chatbubbles'} 
              size={26} 
              color="#fff" 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Chatbot Modal */}
      <Modal
        visible={showChatbot}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChatbot(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.avatarBox}>
                  <Ionicons name="school" size={24} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>SIU Assistant</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Đang hoạt động</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowChatbot(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((message) => (
                <View 
                  key={message.id} 
                  style={[styles.messageRow, message.type === 'user' && styles.messageRowUser]}
                >
                  {message.type === 'bot' && (
                    <View style={styles.botAvatar}>
                      <Ionicons name="school" size={16} color="#3B82F6" />
                    </View>
                  )}
                  <View style={styles.messageContent}>
                    <View style={[
                      styles.messageBubble,
                      message.type === 'user' ? styles.userBubble : styles.botBubble
                    ]}>
                      {message.isLoading ? (
                        <View style={styles.loadingDots}>
                          <View style={[styles.dot, styles.dot1]} />
                          <View style={[styles.dot, styles.dot2]} />
                          <View style={[styles.dot, styles.dot3]} />
                        </View>
                      ) : (
                        <Text style={[
                          styles.messageText,
                          message.type === 'user' && styles.userMessageText
                        ]}>
                          {message.content}
                        </Text>
                      )}
                    </View>
                    {message.options && !message.isLoading && message.type === 'bot' && (
                      <View style={styles.optionsContainer}>
                        {message.options.map((option, idx) => (
                          <TouchableOpacity 
                            key={idx} 
                            style={styles.optionBtn}
                            onPress={() => handleSendMessage(option)}
                            disabled={isTyping}
                          >
                            <Text style={styles.optionText}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Hỏi về số dư, máy in..."
                placeholderTextColor="#9CA3AF"
                editable={!isTyping}
                onSubmitEditing={() => handleSendMessage(inputValue)}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, (!inputValue.trim() || isTyping) && styles.sendBtnDisabled]}
                onPress={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  menuContainer: {
    marginBottom: 12,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  zaloText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0068FF',
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  statusText: {
    fontSize: 12,
    color: '#BFDBFE',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Messages
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContent: {
    maxWidth: '80%',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  userMessageText: {
    color: '#fff',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#93C5FD',
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 1 },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  optionBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  optionText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
