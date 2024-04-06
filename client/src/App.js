import React from 'react';
import {
  Avatar,
  CardHeader,
  CardFooter,
  ChakraProvider,
  Box,
  Text,
  VStack,
  Button,
  Center,
  Heading,
  HStack,
  Divider,
  Card,
  Stack,
  CardBody,
  Image,
} from '@chakra-ui/react';
import { ChatIcon, DownloadIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import ChatBox from './components/ChatBox';
import TypeIt from 'typeit-react';

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = new SpeechRecognition();

mic.continuous = true;
mic.interimResults = true;
mic.lang = 'en-US'; // can change language for different regions

function App() {
  // store responses from gemini in variable named data
  const [data, setData] = useState({ response: '' });

  // audio stuff for recording speech to text transcripts
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [savedTranscripts, setSavedTranscripts] = useState([]);

  // handler for voice recording
  const handleListen = () => {
    if (isListening) {
      mic.start();
      mic.onend = () => {
        console.log('continue listening');
        mic.start();
      };
    } else {
      mic.stop();
      mic.onend = () => {
        console.log('Stopped Mic on Click');
      };
    }
    mic.onstart = () => {
      console.log('Mic on');
    };

    mic.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      console.log(transcript);
      setTranscript(transcript);
      mic.onerror = event => {
        console.log(event.error);
      };
    };
  };

  // handler for saving voice transcript
  const handleSaveTranscript = () => {
    console.log('transcript: ', transcript);

    setSavedTranscripts(savedTranscripts => [...savedTranscripts, transcript]); // Using the functional form of setState

    console.log(JSON.stringify([...savedTranscripts, transcript]));

    // fetch for sending data
    // Making an AJAX request to Flask backend
    fetch('/send-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // send updated so not one behind
      body: JSON.stringify({ data: [...savedTranscripts, transcript] }),
    })
      .then(res => res.json())
      .then(responseData => {
        setData({ response: responseData.response }); // Update state with the response
        console.log('Response received from Gemini:', responseData);
      })
      .catch(error => {
        console.error('Error sending data:', error);
      });
    setTranscript('');
  };

  // handler for downloading PDF
  const handleDownload = () => {
    console.log('handle download called');

    // call report generation in flask backend
    fetch('/report', {
      method: 'POST',
    })
      .then(response => {
        if (response.ok) {
          return response.text(); // Assuming the response is text
        }
        throw new Error('Network response was not ok.');
      })
      .then(data => {
        // Handle the generated report data here
        console.log('name of pdf file generated and you can find: ', data);
      })
      .catch(error => {
        console.error('There was a problem with your pdf download:', error);
      });
  };

  // run handle listen when isListening
  useEffect(() => {
    handleListen();
  }, [isListening]);

  // fetch GEMINI RESPONSE from backend to frontend, should re-render
  useEffect(() => {
    console.log('re-render when data changes');
  }, [data]);

  return (
    <ChakraProvider>
      <Center
        color="black"
        backgroundColor="teal"
        bgGradient="linear(to-l, teal.600, blue.600)"
      >
        <Image
          mt="20px"
          borderRadius="full"
          boxSize="100px"
          src="https://i.imgur.com/iLMAeW1.png"
        />

        <Heading
          ml="20px"
          mt="20px"
          mb="10px"
          color="white"
          fontSize="6xl"
          fontWeight="extrabold"
          size="6xl"
        >
          Tuberculosis AI Pre-Screening
        </Heading>
      </Center>

      <Center color="white" bgGradient="linear(to-l, teal.600, blue.600)">
        <Text mb="30px" fontSize="xl">
          Generative AI and speech-to-text to detect potential TB cases and
          create a report for doctors
        </Text>
      </Center>

      <Center mt="100px" mb="100px" color="black">
        <HStack spacing="20px">
          <Avatar size="lg" src="https://i.imgur.com/IO3XefC.png" />
          {data.response == '' ? (
            <div>
              <b>Hello!</b> Tell me about yourself and if you have any TB
              symptoms.{' '}
            </div>
          ) : (
            <div>{data.response} </div>
          )}
        </HStack>
      </Center>

      <Center>
        <Card align="center" width="700px" mb="10px">
          <CardHeader>
            {isListening ? (
              <Heading size="lg">Voice Input 🔴</Heading>
            ) : (
              <Heading size="lg">Voice Input 🎙️</Heading>
            )}
          </CardHeader>
          <CardBody>
            <Text color={'blue.600'}>{transcript}</Text>
          </CardBody>
          <CardFooter>
            <VStack>
              <Center>
                <HStack>
                  <Button
                    rightIcon={<ChatIcon />}
                    variant="solid"
                    colorScheme="red"
                    size="lg"
                    onClick={() => setIsListening(prevState => !prevState)}
                  >
                    {isListening ? (
                      <span>Stop Recording</span>
                    ) : (
                      <span>Start Recording</span>
                    )}
                  </Button>

                  {isListening || transcript == null ? (
                    <Text>Wait a couple seconds before speaking</Text>
                  ) : (
                    <HStack>
                      <Button
                        rightIcon={<CheckCircleIcon />}
                        colorScheme="green"
                        size="lg"
                        onClick={handleSaveTranscript}
                      >
                        Submit Answer
                      </Button>

                      <Button
                        rightIcon={<DownloadIcon />}
                        colorScheme="blue"
                        size="lg"
                        onClick={handleDownload} // creates PDF in file system
                      >
                        Generate PDF
                      </Button>
                    </HStack>
                  )}
                </HStack>
              </Center>
            </VStack>
          </CardFooter>
        </Card>
      </Center>

      <Center mt="50px">
        <Stack>
          <HStack width="50%" maxWidth="6xl">
            <Stack>
              <Text fontSize="3xl">
                <b>Your Responses</b>
              </Text>
              <Divider></Divider>
              <Box overflowY="auto" maxHeight="150px" minWidth="6xl">
                <ChatBox data={savedTranscripts} />
              </Box>
            </Stack>
          </HStack>
        </Stack>
      </Center>
    </ChakraProvider>
  );
}

export default App;
