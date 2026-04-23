import React, { useCallback, useEffect, useState } from 'react';
import styles from './resultModal.module.css';
import { Button, ConfigProvider } from 'antd';
import Modal from 'react-modal';
import { DownloadOutlined } from '@ant-design/icons';
import { _eventSenderGA } from '../../tools/tools';

const BackgroundModal = ({ testTitle, testResultContents, testLang }) => {
  const [texts, setTexts] = useState([
    '모든 배경화면은 “케이테스트” 캐릭터를 이용해 직접 제작한 페이스입니다.',
    '수정 및 재배포를 절대 금합니다',
    '인스타그램 내에서 다운로드가 안될 수 있어서 다른 웹 브라운저(사파리, 크롬, 네이버, 카카오톡 등)를 이용해서 다운로드 받아주세요',
    '다른 테스트 결과에는 다른 배경화면이 있어요!',
    '배경화면 다운로드',
  ]);
  const modalStyles = {
    overlay: {
      backgroundColor: 'rgba(189, 195,199, 0.7)',
    },
    content: {
      backgroundColor: 'white',
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      height: '70%',
      width: '85%',
      maxWidth: '30rem',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      WebkitOverflowScrolling: 'touch',
      borderRadius: '1rem',
      border: '3px solid white',
    },
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const showModal = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (testLang !== 'Kor') {
      setTexts([
        'The characters and designs of this Background are original creations by KTESTONE.',
        'Unauthorized use, distribution, or reproduction of this design is prohibited.',
        'Please use another web browser (Safari, Chrome, Naver, KakaoTalk, etc.) to download the app as it may not be available within Instagram.',
        'There are other Backgrounds for other results!',
        'Download the Background',
      ]);
    }
  }, [testLang]);

  const onDownLoadClick = useCallback(() => {
    _eventSenderGA(
      'Download',
      'Click Background-download Button',
      'result page modal'
    );
  }, []);

  return (
    <>
      <ConfigProvider
        theme={{
          components: {
            Button: {
              defaultHoverBorderColor: '#e62182',
              defaultHoverColor: '#e62182',
            },
          },
        }}
      >
        <div>
          <img
            src={`https://web.archive.org/web/0im_/https://images.ktestone.com/resultImages/${testTitle}/${testTitle}-modal-header.jpg`}
            alt={`${testTitle}`}
            className='result-img'
            onClick={showModal}
            style={{ cursor: 'pointer' }}
          />
        </div>

        <Modal
          isOpen={isModalOpen}
          onRequestClose={handleCancel}
          style={modalStyles}
          contentLabel='#AppElement'
          ariaHideApp={false}
        >
          <div className={styles.modalCloseButton} onClick={handleOk}>
            X
          </div>
          <div className={styles.modalTopAlertDiv}>
            <p>
              <span>
                ❗️❗️{texts[0]}
                <br />
                <span>🚫 {texts[1]} 🚫</span>
                <br />
                <span>©️ 2024 KTESTONE All Rights Reserved.</span>
              </span>
            </p>
          </div>
          <div>
            <p className={styles.downloadComment}>* {texts[2]}</p>
            <p className={styles.downloadComment}>* {texts[3]}</p>
            {testResultContents?.background_link ? (
              <a
                href={testResultContents?.background_link}
                target='_blank'
                rel='noopener noreferrer'
              >
                <Button
                  style={{ marginTop: '1.5rem' }}
                  className={styles.downloadButton}
                  onClick={onDownLoadClick}
                >
                  <DownloadOutlined /> {texts[3]}
                </Button>
              </a>
            ) : null}
            <img
              src={`https://web.archive.org/web/0im_/https://images.ktestone.com/resultImages/${testTitle}/backgroundImage/${testResultContents?.type}.png`}
              alt='sample'
              width={'100%'}
            />
          </div>
          <div style={{ width: '50%', display: 'inline-block' }}>
            <button
              key={'okay'}
              onClick={handleOk}
              className={styles.modalOkButton}
            >
              Okay
            </button>
          </div>
        </Modal>
      </ConfigProvider>
    </>
  );
};

export default BackgroundModal;
