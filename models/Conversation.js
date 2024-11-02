import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoBack from '../components/GoBack';
import IMAGES from '../images/images';
import { IoMdMic } from "react-icons/io";
import { MdKeyboard } from "react-icons/md";
import { FaXmark } from "react-icons/fa6";
import axios from 'axios';
import '../App.css';

export default function Conversation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedSubTopic, selectedDifficulty } = location.state || {}; // 선택한 소주제와 난이도
  const [conversations, setConversations] = useState([]);

  // 컴포넌트가 마운트될 때 대화 내용 가져오기
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        // 선택한 주제와 난이도로 대화 내용 요청 \
        const response = await axios.get('http://localhost:3000/conversation');
        setConversations(response.data);
      } catch (error) {
        console.error('대화 내용을 가져오는 데 오류가 발생했습니다:', error);
      }
    };

    fetchConversations();
  },  [selectedSubTopic, selectedDifficulty]); // 의존성 배열에 추가

  const stopConversation = () => {
    alert('대화를 종료합니다.');
  };

  const speakToMic = () => {
    alert('마이크가 켜졌습니다.');
  };

  const typing = () => {
    alert('문자를 입력해주세요.');
  };

  return (
    <div className="container">
      <GoBack />
        <h2 className="conversation-title">{selectedSubTopic} - {selectedDifficulty}</h2>
      <div className='chat-container'>
        {conversations.map((conv) => (
          <div key={conv.id}>
            <div className='bettuChatText'>
              <img src={IMAGES.bettu} alt="bettu" className="image chatImage" />
              <div className='chatBubble'>
                {conv.bot}
              </div>
            </div>
            <div className='chatBubble chatBubbleRight'>
              <div className='userChatText'>
                {conv.user}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className='userChatInput'>
        <FaXmark onClick={stopConversation} />
        <IoMdMic onClick={speakToMic} />
        <MdKeyboard onClick={typing} />
      </div>
    </div>
  );
}
