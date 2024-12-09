import { PictureInPicture } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import MusicPlayerPopup from "./musicPlayerPopup";

const PipButton = () => {
  const contentRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [inPip, setInPip] = useState(false);

  useEffect(() => {
    // Ensure the ref is set and not null
    if (contentRef.current) {
      console.log("Content ref is available:", contentRef.current);
    }
  }, []);

  const togglePictureInPicture = async () => {
    if (window.documentPictureInPicture.window) {
      // Exit PiP if already in PiP mode
      setInPip(false);

      // Ensure that the content is still part of the player container
      if (playerContainerRef.current && contentRef.current) {
        playerContainerRef.current.appendChild(contentRef.current);
      }

      window.documentPictureInPicture.window.close();
    } else {
      try {
        // Ensure contentRef is not null before proceeding
        if (contentRef.current) {
          const width = contentRef.current.clientWidth;
          const height = document.documentElement.clientHeight + 50; // Add extra height for controls

          // Request a new PiP window with both width and height specified
          const pipWindow = await window.documentPictureInPicture.requestWindow(
            {
              width: width,
              height: height,
            }
          );

          // Add event listener to handle when PiP window is closed
          pipWindow.addEventListener("pagehide", () => {
            setInPip(false);

            // Ensure that the content is re-appended to the original container
            if (playerContainerRef.current && contentRef.current) {
              playerContainerRef.current.appendChild(contentRef.current);
            }
          });

          // Move the content element into the PiP window
          pipWindow.document.body.appendChild(contentRef.current);

          // Copy styles from the main document to the PiP window
          [...document.styleSheets].forEach((styleSheet) => {
            try {
              const cssRules = [...styleSheet.cssRules]
                .map((rule) => rule.cssText)
                .join("");
              const style = pipWindow.document.createElement("style");
              style.textContent = cssRules;
              pipWindow.document.head.appendChild(style);
            } catch (e) {
              const link = pipWindow.document.createElement("link");
              link.rel = "stylesheet";
              link.type = styleSheet.type;
              link.media = styleSheet.media;
              link.href = styleSheet.href;
              pipWindow.document.head.appendChild(link);
            }
          });

          setInPip(true);
        }
      } catch (error) {
        console.error("Error requesting PiP window:", error);
      }
    }
  };

  return (
    <div id="contents">
      <div id="container" ref={playerContainerRef}>
        {inPip && <p id="in-pip-message"></p>}
        <div id="player">
          {/* Ensure contentRef is used correctly and is a valid DOM node */}
          <div className="max-w-md h-fit w-full" ref={contentRef}>
            {/* <MusicPlayerPopup hiddenLink={false} inPip={inPip} /> */}
          </div>
          <div id="credits"></div>
          <div id="controlbar">
            <button
              className="text-black rounded-lg px-2 py-1 dark:text-white "
              onClick={togglePictureInPicture}
            >
              <PictureInPicture />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipButton;
