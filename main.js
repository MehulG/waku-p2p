import { createLightNode, waitForRemotePeer, createEncoder, createDecoder } from "@waku/sdk";
import protobuf from "protobufjs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


// Create and start a Light Node
const node = await createLightNode({ defaultBootstrap: true });
await node.start().then(async () => {
  console.log("node started");
  // Wait for a successful peer connection
  await waitForRemotePeer(node).then(
    async () => {
      // Choose a content topic
      const contentTopic = "/test-app/1/test-messages/proto";
      console.log("contentTopic: ", contentTopic);
      // Create a message encoder and decoder
      const encoder = createEncoder({ contentTopic });
      const decoder = createDecoder(contentTopic);
      // Create a message structure using Protobuf
      const ChatMessage = new protobuf.Type("ChatMessage")
        .add(new protobuf.Field("timestamp", 1, "uint64"))
        .add(new protobuf.Field("sender", 2, "string"))
        .add(new protobuf.Field("message", 3, "string"));


      const sendMessage = async (message) => {
        const protoMessage = ChatMessage.create({
          timestamp: Date.now(),
          sender: "YourUsername",  // Change to your preferred username
          message: message,
        });
        const serialisedMessage = ChatMessage.encode(protoMessage).finish();
        await node.lightPush.send(encoder, { payload: serialisedMessage });
      };
      // const protoMessage = ChatMessage.create({
      //   timestamp: Date.now(),
      //   sender: "Alice",
      //   message: "Hello, World!",
      // });
      // console.log("msg created");
      // // Serialise the message using Protobuf
      // const serialisedMessage = ChatMessage.encode(protoMessage).finish();
      // console.log("sending message");
      // // Send the message using Light Push
      // await node.lightPush.send(encoder, {
      //   payload: serialisedMessage,
      // });
      // console.log("msg sent");

      // Create the callback function
      const callback = (wakuMessage) => {
        // Check if there is a payload on the message
        if (!wakuMessage.payload) return;
        // Render the messageObj as desired in your application
        const messageObj = ChatMessage.decode(wakuMessage.payload);
        console.log(messageObj);
      };

      // Create a filter subscription
      const subscription = await node.filter.createSubscription();

      // Subscribe to content topics and process new messages
      await subscription.subscribe([decoder], callback);
      console.log("listening to messages");
      // setTimeout(() => {
      //   console.log('stopping node');
      //   node.stop()
      // }, 3000);
      const chatPrompt = () => {
        rl.question('Enter message: ', async (message) => {
          if (message.toLowerCase() === 'exit') {
            console.log('Exiting chat...');
            rl.close();
            await node.stop();
            process.exit(0);
          } else {
            await sendMessage(message);
            chatPrompt();  // Prompt for the next message
          }
        });
      }
      chatPrompt();
    }
  )

});

// Use the stop() function to stop a running node
