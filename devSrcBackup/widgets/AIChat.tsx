// @nlux imports
import { AiChat, ErrorEventDetails } from '@nlux/react';
import "@nlux/themes/nova.css";
import { ChatAdapter, ChatAdapterExtras, StreamingAdapterObserver } from '@nlux/core';
//import {highlighter} from '@nlux/highlighter';

// Dashjoin imports
import React, { useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Icon } from "@mui/material";
import { Widget } from "../model/widget";
import { roles, style, text, title } from "../api/Const";
import Expression from "../uniforms/Expression";
import { useExpression } from '../hooks/useExpression';
import { Loading } from 'react-admin';
import { PrintError } from '../components/PrintError';
import Script from 'next/script';
import LanguageDetect from 'languagedetect';

const debug = localStorage.getItem("dj_ai_debug") === "true";

// Demo adapter simulating
const demoStreamAdapter: ChatAdapter = {
    streamText: (
        message: string,
        observer: StreamingAdapterObserver,
        extras: ChatAdapterExtras,
    ) => {
        debug && console.dir(extras, { depth: 3 });
        setTimeout(() => {
            const messageToStream = 'This is a demo text. Configure the url in the config to access an AI service. Lorem stream ipsum **dolor** sit amet, consectetur adipiscing elit. ' +
                'Sed non risus. Suspendisse lectus tortor, dignissim sit amet, ' +
                'adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. ';

            const mockTokens = messageToStream.split(' ');
            mockTokens.forEach((token) => {
                observer.next(token + ' ');
            });

            observer.complete();
        }, 100);
    },
};

// PrivateGPT REST API:
// SERVICE_URL = "http://localhost:8001/v1/completions"

// POST <host>/v1/completions
// {
//     "include_sources": false,
//     "prompt": "How do you fry an egg?",
//     "stream": false,
//     "system_prompt": "You are a rapper. Always answer with a rap.",
//     "use_context": false,
//     "include_sources": true
// }

class PGPTChatAdapter implements ChatAdapter {
    url: string;
    aiConfig: any;
    history: any[];
    SOURCES_SEPARATOR = "\n\n\n**Sources:**\n\n\n";
    maxHistory = 20;

    constructor(url: string, aiConfig: any, history: any) {
        this.url = url;
        this.aiConfig = aiConfig;
        this.history = history;
    }

    promptToBody(message: string) {
        const body = {
            ...{ prompt: message, stream: true },
            ...this.aiConfig
        };
        return JSON.stringify(body);
    };

    /**
     * From the complete history, build the "context history" for the next request
     * to the server.
     * 
     * - Limit the # of messages (context tokens are limited)
     * - Keep the system message (system prompt)
     * - Filter the sources out of the messages
     * 
     * @returns context history
     */
    buildHistoryForRequest() {
        const result = [];

        let rest = this.history.map(e => {
            // Filter sources from history context
            if (e.role === "assistant") {
                const sysIdx = e.content.lastIndexOf(this.SOURCES_SEPARATOR);
                if (sysIdx > 0)
                    return { role: e.role, content: e.content.substring(0, sysIdx) };
            }
            return e;
        });

        // Keep the system prompt
        if (rest[0]?.role === "system") {
            result.push(rest[0]);
            rest = rest.slice(1);
        }

        result.push(...rest.slice(Math.max(0, rest.length - this.maxHistory)));
        return result;
    }

    promptToChatBody(message: string) {
        // Add user request to history
        this.history.push({
            role: "user",
            content: message
        });

        const contextHistory = this.buildHistoryForRequest();

        const body = {
            ...{ messages: contextHistory, stream: true },
            ...this.aiConfig
        };
        debug && console.log("history", contextHistory);
        return JSON.stringify(body);
    };

    async streamText(prompt: string, observer: StreamingAdapterObserver) {

        // Check for voice command
        if (prompt.startsWith("DJ ")) {
            debug && console.log("DJ Command", prompt);
            //observer.error(new Error('DJ Command OK'));
            setTimeout(() => {
                observer.next("OK");
                observer.complete();
            }, 100);
            return;
        }

        let response;
        try {
            const isChat = this.aiConfig.type === "dj-chat";
            const headers: any = { 'Content-Type': 'application/json' }
            if (this.url.includes('rest/functionStream'))
                headers.Authorization = localStorage.getItem("auth-token")
            response = await fetch(this.url, {
                method: 'POST',
                headers,
                body: isChat ? this.promptToChatBody(prompt) : this.promptToBody(prompt),
            });
        } catch (e: any) {
            observer.error(e); return;
        }

        if (response.status !== 200) {
            observer.error(new Error('Failed to connect to the server'));
            return;
        }

        if (!response.body) {
            observer.error(new Error('Invalid response from server'));
            return;
        }

        // Read a stream of server-sent events
        // and feed them to the observer as they are being generated
        const reader = response.body.getReader();
        const textDecoder = new TextDecoder();
        let doneReading = false;

        const docs = new Set<string>();

        let fragment = ''
        while (!doneReading) {
            const { value, done } = await reader.read();
            if (done) {
                doneReading = true;
                continue;
            }

            // We're getting a list of data chunks like this:
            // data: {"id":"ae7785e5-7dac-433d-92b1-1d4c0e72bb6d","object":"completion.chunk","created":1710429697,"model":"private-gpt","choices":[{"finish_reason":"stop","delta":{"content":""},"message":null,"sources":null,"index":0}]}
            // at the end we get
            // data: [DONE]
            const results = (fragment + textDecoder.decode(value)).split("\n");
            fragment = ''

            if (results[results.length - 1] !== '') {
                // line did not end with newline - we have a partial line which we remember for the next pass
                fragment = results[results.length - 1]
                results[results.length - 1] = ''

                debug && console.log('received partial line', fragment)
            }

            for (const result of results) {
                if (result.trim() === "")
                    continue;
                if (result === "data: [DONE]")
                    break;

                let obj = undefined;
                try {
                    obj = JSON.parse(result.substring(5));
                } catch (e: any) {
                    console.log("Error parsing", e, result);
                }

                if (debug)
                    console.log("value", obj);

                const chunk = obj?.choices[0]?.delta?.content;
                if (chunk) {
                    observer.next(chunk);
                }

                if (obj?.choices[0]?.sources)
                    for (const src of obj?.choices[0]?.sources) {
                        let docText: string = src.document?.doc_metadata.file_name;
                        let page = src.document?.doc_metadata.page_label;
                        if (page)
                            docText += " (page " + page + ")";
                        docs.add(docText);
                    }
            }
        }

        if (docs.size > 0) {
            // Add sources to response:
            observer.next(this.SOURCES_SEPARATOR);
            for (const doc of docs) {
                observer.next(doc + "\n\n");
            }
        }

        observer.complete();
    }
}

export const AIChat = ({ widget }: { widget: any }) => {

    let url = widget.url
    if (url) {
        if (!url.includes('/'))
            if (window.location.host === 'localhost:3000')
                url = 'http://localhost:8080/rest/functionStream/' + url
            else
                url = '/rest/functionStream/' + url
    }

    // DOM reference. Fixes multiple widgets per page + caching issues
    const ref = useRef(null);

    // Parse config, ignore errors
    const { data, isLoading, error } = useExpression(widget.cached!, widget.extraArgs)
    if (isLoading) return <Loading />
    if (error) return <PrintError error={error}></PrintError>

    let extraArgs = data || {};

    let promptConfig = extraArgs?.promptConfig || {};
    delete extraArgs.promptConfig;
    if (widget.knowledge_base === true) {
        promptConfig.use_context = true;
        promptConfig.include_sources = true;
    }

    // Set the service type, defaults to "dj-chat"
    promptConfig.type = widget.type || "dj-chat";
    // Validate supported service types
    if (["dj-chat", "dj-completion"].indexOf(promptConfig.type) < 0)
        return (<div>{"AIChat: invalid service type: " + promptConfig.type}</div>);

    const aiConfig: any = {
        url,
        personaOptions: {
            bot: {
                name: widget.name || '',
                tagline: widget.tagline || '',
                picture: widget.logo || 'https://dashjoin.com/img/fav.png'
            }
        },
        promptConfig: {
            system_prompt: widget.system_prompt || '',
            ...promptConfig
        },
        ...extraArgs
    }

    if (debug)
        console.log("AIChat", aiConfig);

    const history: any = [];
    if (aiConfig.promptConfig.system_prompt)
        history.push({
            role: "system",
            content: aiConfig.promptConfig.system_prompt
        });

    const streamAdapter = aiConfig.url ? new PGPTChatAdapter(aiConfig.url, aiConfig.promptConfig, history)
        : demoStreamAdapter;

    const errorEventCallback = ({ errorId, message }: ErrorEventDetails) => {
        console.error('Error ❌ event callback with error ID:', errorId);
        console.error('Details:', message);
    };
    const messageSentCallback = (message: string) => {
        debug && console.log('Message 👋 sent callback with message:', message);

        window.speechSynthesis.cancel();
    };
    const messageReceivedCallback = (message: string) => {
        debug && console.log('Message 📮 received callback with message:', message);

        history.push({
            role: "assistant",
            content: message
        });

        window.speechSynthesis.cancel();

        const voice = localStorage.getItem("djAiChat") === "voice";
        localStorage.removeItem("djAiChat");

        if (!voice)
            return;

        const utter = new SpeechSynthesisUtterance(message);
        const lngDetector = new LanguageDetect();
        lngDetector.setLanguageType("iso2");
        let lang = "en";
        try {
            lang = lngDetector.detect(message)[0][0];
        } catch (ignore) { }
        debug && console.log("Detected language", lang);
        utter.lang = lang !== "und" ? lang : "en";
        window.speechSynthesis.speak(utter);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} ref={ref}>
            <Script src="assets/speech-input.js" />
            <AiChat
                className="dj-aichat"
                adapter={streamAdapter}
                conversationOptions={{
                    scrollWhenGenerating: aiConfig.scrollWhenGenerating || true,
                    streamingAnimationSpeed: aiConfig.animationSpeed || 0
                }}
                layoutOptions={{
                    height: aiConfig.height,
                    width: aiConfig.width,
                }}
                promptBoxOptions={{
                    placeholder: aiConfig.textQuestion || 'Enter your question here',
                    autoFocus: aiConfig.autoFocus,
                }}
                //syntaxHighlighter={highlighter}
                personaOptions={aiConfig.personaOptions}
                initialConversation={aiConfig.initialConversation}
                events={{
                    error: errorEventCallback,
                    messageSent: messageSentCallback,
                    messageReceived: messageReceivedCallback,
                }}
            />
        </div>
    );
};

export default AIChat;

export const config = {
    id: 'aichat',
    title: 'AIChat',
    description: 'Chat with AI',
    version: 1,
    icon: <Icon>chat</Icon>,
    controls: {
        type: 'autoform',
        schema: {
            properties: {
                title: title,
                url: { title: 'LLM Service URL or function name', type: 'string' },
                type: { title: 'LLM Service Type', type: 'string', enum: ['dj-chat', 'dj-completion'] },
                name: { title: 'Chatbot name', type: 'string' },
                tagline: { title: 'Chatbot tagline', type: 'string' },
                logo: { title: 'Logo URL', type: 'string' },
                system_prompt: {
                    title: 'AI System Prompt', type: 'string', uniforms: {
                        multiline: true
                    },
                },
                knowledge_base: { title: 'Query the Knowledge Base', type: 'boolean' },
                extraArgs: { title: 'Additional config settings', uniforms: { component: Expression } },
            }
        }
    }
}
/**
// sample aiconfig:
{
 "url": "http://localhost:8001/v1/completions",
 "personaOptions":{
  "bot":{
    "name": "Sicherheits-KI",
    "tagline": "Die Künstliche Intelligenz zum Grundschutz des Bundesamts für Sicherheit in der Informationstechnik (BSI)",
"picture":"https://static.vecteezy.com/system/resources/previews/021/608/790/non_2x/chatgpt-logo-chat-gpt-icon-on-black-background-free-vector.jpg"
  }
 },
 "promptConfig":{
   "system_prompt":"You can only answer questions about the provided context. If you know the answer but it is not based in the provided context, don't provide the answer, just state the answer is not in the context provided. Answer in German."
 }
}

 */
