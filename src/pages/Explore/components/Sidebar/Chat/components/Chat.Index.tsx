import { useEffect, useRef, useState } from "react";
import { ITextStyles, Separator, Stack, Text } from "@fluentui/react";

import { addMessage, addResponse, clearChats } from "pages/Explore/state/chatSlice";
import { useExploreDispatch, useExploreSelector } from "pages/Explore/state/hooks";
import {
  setBulkLayers,
  setCollection,
  setCustomQueryBody,
  setIsCustomQuery,
  setRenderOption,
} from "pages/Explore/state/mosaicSlice";
import { setCamera, setSidebarPanel } from "pages/Explore/state/mapSlice";
import { ExporterHeader } from "../../exporters/BaseExporter/ExporterHeader";
import { SidebarPanels } from "pages/Explore/enums";
import { useUrlStateV2 } from "../../selectors/hooks/useUrlStateV2";
import { useCollections } from "utils/requests";
import { useChatApi } from "../api";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { AuthPage } from "components/auth";
import { ChatMessage } from "../types";
import { ChatMessageList } from "./ChatMessageList";
import {
  getMessageHistory,
  makeBotMessage,
  makeErrorMessage,
  makeUserMessage,
} from "../helpers";

const Chat = () => {
  const dispatch = useExploreDispatch();
  const [inputMessage, setInputMessage] = useState<ChatMessage>();
  const { messages, responses } = useExploreSelector(state => state.chat);
  const history = getMessageHistory(messages, inputMessage, responses);
  const { data: collections } = useCollections();
  const {
    isLoading,
    isError,
    data: apiResponse,
  } = useChatApi(inputMessage, history);
  const messageListRef = useRef<HTMLDivElement>(null);

  useUrlStateV2();

  const handleSend = (message: string) => {
    const userMessage = makeUserMessage(message);
    setInputMessage(userMessage);
  };

  const handleReset = () => {
    setInputMessage(undefined);
    dispatch(clearChats());
    dispatch(setBulkLayers({ layers: {}, layerOrder: [] }));
  };

  const handleClose = () => {
    dispatch(setSidebarPanel(SidebarPanels.itemSearch));
  };

  useEffect(() => {
    if (inputMessage) {
      dispatch(addMessage(inputMessage));
    }
  }, [dispatch, inputMessage]);

  useEffect(() => {
    if (isError) {
      dispatch(addMessage(makeErrorMessage()));
    }
  }, [dispatch, isError]);

  useEffect(() => {
    // Keep new message visible by scrolling to bottom of container
    messageListRef.current?.scrollIntoView(false);

    if (!apiResponse) return;

    const { enriched, raw } = apiResponse;

    if (apiResponse) {
      setInputMessage(undefined);
      dispatch(addResponse({ id: enriched.id, response: raw }));
      dispatch(addMessage(makeBotMessage(enriched)));

      enriched.layers.forEach(layer => {
        const collection = collections?.collections.find(
          c => c.id === layer.collectionId
        );
        if (!layer.renderOption || !collection) {
          return;
        }

        dispatch(setCollection(collection));
        dispatch(setIsCustomQuery(true));
        dispatch(setCustomQueryBody(layer.mosaic));
        dispatch(setRenderOption(layer.renderOption));
      });

      if (enriched.map) {
        dispatch(
          setCamera({ center: enriched.map.center, zoom: enriched.map.zoom })
        );
      }
    }
  }, [collections?.collections, apiResponse, messages, dispatch]);

  return (
    <Stack styles={{ root: styles.container }}>
      <Stack.Item styles={{ root: styles.header }}>
        <ExporterHeader title="Planetary Computer CoPilot" onClose={handleClose}>
          <Text styles={introStyle}>
            An experimental generative AI search and explore experience for the
            Planetary Computer.
          </Text>
        </ExporterHeader>
      </Stack.Item>
      <AuthPage>
        <Stack.Item grow styles={{ root: styles.body }}>
          <div
            style={styles.bodyContentContainer as React.CSSProperties}
            ref={messageListRef}
          >
            <ChatMessageList messages={messages} />
            <TypingIndicator visible={isLoading} />
          </div>
        </Stack.Item>
        <Stack.Item>
          <Separator />
          <ChatInput onSend={handleSend} onReset={handleReset} />
        </Stack.Item>
      </AuthPage>
    </Stack>
  );
};

export default Chat;

const introStyle: ITextStyles = {
  root: {
    fontStyle: "italic",
  },
};

const styles = {
  container: {
    height: "100%",
    padding: 10,
  },
  header: {},
  body: {
    flexGrow: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  bodyContentContainer: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
};
