import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { transcodeVideo } from './transcode.js';

// Use envrionment variables
import dotenv from 'dotenv';
dotenv.config();

// SQS Config
const region = process.env.REGION;
const queueUrl = process.env.SQS;

// Create an SQS client
const sqsClient = new SQSClient({ region });

// This function polls the SQS queue for messages
async function pollQueue() {
    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
    };

    try {
        const data = await sqsClient.send(new ReceiveMessageCommand(params));
        if (data.Messages) {
            for (const message of data.Messages) {
                console.log('Received message:', message.Body);

                const parsedMessage = JSON.parse(message.Body);
                const bucket = parsedMessage.bucket;
                const key = parsedMessage.key;

                console.log(bucket);
                console.log(key);

                // After processing, delete the message from the queue using its ReceiptHandle
                const deleteParams = {
                    QueueUrl: queueUrl,
                    ReceiptHandle: message.ReceiptHandle,
                };

                try {
                    await transcodeVideo(bucket, key);
                    await sqsClient.send(new DeleteMessageCommand(deleteParams));
                    console.log('Deleted message with ID:', message.MessageId);
                } catch (processError) {
                    console.error(`Error processing message ${message.MessageId}:`, processError);
                }
            }
        } else {
            console.log('No messages received');
        }
    } catch (error) {
        console.error('Error polling messages:', error);
    }
}

// Continuously poll the SQS queue with 5 second intermission periods to prevent rapid fire api calls
async function startPolling() {
    while (true) {
        await pollQueue();
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second timer
    }
}

// Execute polling function
startPolling();